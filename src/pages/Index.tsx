
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase, Video } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import PostCard from "@/components/PostCard";
import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import Header from "@/components/Header";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleSwipe("right");
      } else if (e.key === "ArrowRight") {
        handleSwipe("left");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, videos.length]);

  const fetchVideos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setVideos(data);
    } else {
      const sampleVideos = [
        { video_id: "youtube:dQw4w9WgXcQ", created_at: new Date().toISOString(), Source: "Youtube" },
        { video_id: "youtube:jNQXAC9IVRw", created_at: new Date().toISOString(), Source: "Youtube" },
        { video_id: "youtube:Y8Wp3dafaMQ", created_at: new Date().toISOString(), Source: "Youtube" },
      ];

      const { error: insertError } = await supabase
        .from('videos')
        .insert(sampleVideos);

      if (!insertError) {
        setVideos(sampleVideos as Video[]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVideos();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSwipe = (direction: "left" | "right") => {
    const newIndex =
      direction === "left"
        ? (currentIndex + 1) % videos.length
        : (currentIndex - 1 + videos.length) % videos.length;
    setCurrentIndex(newIndex);
    setShowComments(false);
  };

  const handleDeleteVideo = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete videos",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('video_id', currentVideo.video_id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete video. You can only delete your own videos.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
      fetchVideos();
      if (currentIndex >= videos.length - 1) {
        setCurrentIndex(Math.max(0, videos.length - 2));
      }
    }
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    let supabaseQuery = supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (query) {
      // Fix: Use proper column name and text search syntax
      supabaseQuery = supabaseQuery.textSearch(
        '"Description/Title"',
        query,
        {
          type: 'plain',
          config: 'english'
        }
      );
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to search videos",
        variant: "destructive",
      });
    } else {
      setVideos(data || []);
      setCurrentIndex(0);
    }
    setIsLoading(false);
  };

  if (isLoading) return <LoadingState />;
  if (videos.length === 0) return <EmptyState />;

  const currentVideo = videos[currentIndex];

  return (
    <div className="min-h-screen bg-black p-4 space-y-4 animate-fade-in">
      <Header
        currentIndex={currentIndex}
        totalVideos={videos.length}
        currentUser={currentUser}
        videoUserId={currentVideo.user_id}
        onDelete={handleDeleteVideo}
        onSwipe={handleSwipe}
        onSearch={handleSearch}
      />
      
      <PostCard
        videoId={currentVideo.video_id}
        onSwipe={handleSwipe}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
      />

      <RelatedVideos
        videos={videos}
        currentVideoId={currentVideo.video_id}
        onVideoSelect={(index) => {
          setCurrentIndex(index);
          setShowComments(false);
        }}
      />
      
      {showComments && (
        <Comments videoId={currentVideo.video_id} />
      )}
    </div>
  );
};

export default Index;
