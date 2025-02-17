
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase, Video } from "@/lib/supabase";

const FIREARMS_KEYWORDS = [
  "firearm",
  "gun",
  "rifle",
  "pistol",
  "shooting",
  "ammunition",
  "tactical",
  "AR-15",
  "handgun",
  "marksmanship"
];

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
      // Default videos focused on firearms and related content
      const sampleVideos = [
        { 
          video_id: "youtube:dQw4w9WgXcQ", 
          created_at: new Date().toISOString(), 
          Source: "Youtube",
          "Description/Title": "Basic Firearm Safety",
          tags: ["firearm", "safety", "training"]
        },
        { 
          video_id: "youtube:jNQXAC9IVRw", 
          created_at: new Date().toISOString(), 
          Source: "Youtube",
          "Description/Title": "Marksmanship Fundamentals",
          tags: ["marksmanship", "training", "shooting"]
        },
        { 
          video_id: "youtube:Y8Wp3dafaMQ", 
          created_at: new Date().toISOString(), 
          Source: "Youtube",
          "Description/Title": "Tactical Training Basics",
          tags: ["tactical", "training", "firearm"]
        }
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

  const handleDeleteVideo = async (currentUser: string | null) => {
    if (!currentUser || currentIndex >= videos.length) return;

    const currentVideo = videos[currentIndex];
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
      await fetchVideos();
      if (currentIndex >= videos.length - 1) {
        setCurrentIndex(Math.max(0, videos.length - 2));
      }
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    const newIndex =
      direction === "left"
        ? (currentIndex + 1) % videos.length
        : (currentIndex - 1 + videos.length) % videos.length;
    setCurrentIndex(newIndex);
  };

  return {
    videos,
    currentIndex,
    isLoading,
    currentVideo: videos[currentIndex],
    fetchVideos,
    handleDeleteVideo,
    handleSwipe,
    setCurrentIndex
  };
};
