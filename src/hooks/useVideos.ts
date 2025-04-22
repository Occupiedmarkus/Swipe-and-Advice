
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase, Video } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

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
  const [dailyStats, setDailyStats] = useState<{
    count: number;
    lastFetchTime: string | null;
    nextFetchAvailable: string | null;
  }>({
    count: 0,
    lastFetchTime: null,
    nextFetchAvailable: null,
  });
  const { toast } = useToast();
  const { currentUser } = useAuth();

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

    if (data) {
      setVideos(data);
    }
    
    // Get today's video count
    const { data: countData } = await supabase.rpc('get_todays_video_count');
    const { data: lastFetchTime } = await supabase.rpc('get_last_fetch_time');
    
    const newCount = countData || 0;
    setDailyStats({
      count: newCount,
      lastFetchTime,
      nextFetchAvailable: newCount >= 5 ? 
        new Date(new Date().setHours(24, 0, 0, 0)).toISOString() : null
    });
    
    // Check if we've just reached 5 videos (only show on initial load if exactly 5)
    if (newCount === 5) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached the daily limit of 5 videos. Check back tomorrow for more!",
      });
    }
    
    setIsLoading(false);
  };

  const fetchNewVideos = async () => {
    try {
      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to fetch new videos",
          variant: "destructive",
        });
        return;
      }

      // Show immediate feedback toast
      toast({
        title: "Processing",
        description: "Fetching new videos. This may take a few moments...",
      });

      const { data, error } = await supabase.functions.invoke('fetch-firearm-videos', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Added ${data.count} new videos! Daily total: ${data.dailyTotal}/5`,
        });
        
        // Update daily stats
        setDailyStats({
          count: data.dailyTotal,
          lastFetchTime: new Date().toISOString(),
          nextFetchAvailable: data.nextFetchAvailable
        });
        
        // If we just reached 5 videos, show a special notification
        if (data.dailyTotal === 5) {
          toast({
            title: "Daily Limit Reached",
            description: "You've reached the daily limit of 5 videos. Check back tomorrow for more!",
          });
        }
        
        // Refresh videos list
        await fetchVideos();
      } else {
        toast({
          title: "Info",
          description: data.message,
        });
      }
      
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch new videos",
        variant: "destructive",
      });
    }
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
    fetchNewVideos,
    handleDeleteVideo,
    handleSwipe,
    setCurrentIndex,
    dailyStats
  };
};
