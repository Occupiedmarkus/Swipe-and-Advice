
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase, Video } from "@/lib/supabase";

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

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    
    try {
      if (!query.trim()) {
        // If search is empty, fetch all videos
        await fetchVideos();
      } else {
        const { data, error } = await supabase
          .rpc('search_videos', {
            search_query: query.trim()
          });

        if (error) throw error;

        // Transform the search results into Video objects
        const searchResults: Video[] = data.map(item => ({
          id: 0, // We don't use this ID in the UI
          video_id: item.video_id,
          created_at: item.created_at,
          "Description/Title": item.description_title,
          Source: item.source,
          tags: [], // Initialize empty tags array
          user_id: null,
          view_count: 0,
          category: null
        }));

        setVideos(searchResults);
        setCurrentIndex(0); // Reset to first result
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    handleSearch,
    handleDeleteVideo,
    handleSwipe,
    setCurrentIndex
  };
};
