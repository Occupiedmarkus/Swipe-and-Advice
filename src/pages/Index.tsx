
import { useState, useEffect } from "react";
import PostCard from "@/components/PostCard";
import Comments from "@/components/Comments";
import { useToast } from "@/components/ui/use-toast";
import { supabase, Video } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import AddVideoForm from "@/components/AddVideoForm";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchVideos = async () => {
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
      return;
    }

    if (data && data.length > 0) {
      setVideos(data);
    } else {
      const sampleVideos = [
        { video_id: "dQw4w9WgXcQ", category: "general" },
        { video_id: "jNQXAC9IVRw", category: "general" },
        { video_id: "Y8Wp3dafaMQ", category: "general" },
      ];

      const { error: insertError } = await supabase
        .from('videos')
        .insert(sampleVideos.map(v => ({
          ...v,
          created_at: new Date().toISOString(),
        })));

      if (!insertError) {
        setVideos(sampleVideos as Video[]);
      }
    }
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

  if (videos.length === 0) {
    return <div className="min-h-screen bg-black p-4 flex items-center justify-center text-white">Loading...</div>;
  }

  const currentVideo = videos[currentIndex];
  const canDelete = currentUser && currentVideo.user_id === currentUser;

  return (
    <div className="min-h-screen bg-black p-4 space-y-4">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/6-holes.png" alt="Six Holes Logo" className="h-16 w-16 object-contain" />
            <h1 className="text-3xl font-semibold text-white">Swipe & Comment</h1>
          </div>
          <div className="flex gap-2">
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDeleteVideo}
                className="text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Video
              </Button>
            )}
          </div>
        </div>
        <p className="text-gray-400">Swipe left or right to explore content</p>
      </div>
      
      <PostCard
        videoId={videos[currentIndex].video_id}
        onSwipe={handleSwipe}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
      />
      
      {showComments && (
        <Comments videoId={videos[currentIndex].video_id} />
      )}
    </div>
  );
};

export default Index;
