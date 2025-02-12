import { useState, useEffect } from "react";
import PostCard from "@/components/PostCard";
import Comments from "@/components/Comments";
import { useToast } from "@/components/ui/use-toast";
import { supabase, Video } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import AddVideoForm from "@/components/AddVideoForm";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import SearchBar from "@/components/SearchBar";
import RelatedVideos from "@/components/RelatedVideos";

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Keyboard navigation
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
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user?.id ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleVideoAdded = () => {
    fetchVideos();
  };

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
      supabaseQuery = supabaseQuery.textSearch(
        'Description/Title',
        query
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center text-white space-y-4">
        <Skeleton className="w-full max-w-3xl h-[60vh] rounded-xl bg-gray-800/50" />
        <div className="w-full max-w-3xl space-y-4">
          <Skeleton className="h-12 w-48 bg-gray-800/50" />
          <Skeleton className="h-24 w-full bg-gray-800/50" />
        </div>
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center text-white space-y-4">
        <p className="text-xl" role="status">No videos available</p>
        <p className="text-gray-400">Check back later for new content!</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];
  const canDelete = currentUser && currentVideo.user_id === currentUser;

  return (
    <div className="min-h-screen bg-black p-4 space-y-4 animate-fade-in">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img 
              src="/6-holes.png" 
              alt="Six Holes Logo" 
              className="h-16 w-16 object-contain hover:scale-110 transition-transform duration-300" 
              loading="eager"
            />
            <div className="text-left">
              <h1 className="text-3xl font-semibold text-white">Swipe & Advice</h1>
              <p className="text-gray-400 text-sm">Video {currentIndex + 1} of {videos.length}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {currentUser && videos[currentIndex]?.user_id === currentUser && (
              <Button
                variant="destructive"
                onClick={handleDeleteVideo}
                className="text-white hover:scale-105 transition-transform duration-300"
                aria-label="Delete current video"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Video
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="space-y-2 bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
          <p className="text-gray-300">Use arrow keys or swipe to navigate videos</p>
          <p className="text-gray-400 text-sm">*you can only advise once</p>
          <div className="flex justify-center gap-4 mt-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSwipe("right")}
              className="text-white"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSwipe("left")}
              className="text-white"
              aria-label="Next video"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      <PostCard
        videoId={videos[currentIndex]?.video_id}
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
        <Comments videoId={videos[currentIndex]?.video_id} />
      )}
    </div>
  );
};

export default Index;
