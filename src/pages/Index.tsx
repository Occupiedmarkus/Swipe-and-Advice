
import { useState, useEffect } from "react";
import PostCard from "@/components/PostCard";
import Comments from "@/components/Comments";
import { useToast } from "@/components/ui/use-toast";
import { supabase, Video } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import AddVideoForm from "@/components/AddVideoForm";

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

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
      // Insert sample videos if none exist
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

  if (videos.length === 0) {
    return <div className="min-h-screen bg-black p-4 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black p-4 space-y-4">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold text-white">Swipe & Comment</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white">
              <DialogHeader>
                <DialogTitle>Add New Video</DialogTitle>
              </DialogHeader>
              <AddVideoForm onSuccess={handleVideoAdded} />
            </DialogContent>
          </Dialog>
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
