
import { Video } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RelatedVideosProps {
  videos: Video[];
  currentVideoId: string;
  onVideoSelect: (index: number) => void;
}

const RelatedVideos = ({ videos, currentVideoId, onVideoSelect }: RelatedVideosProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const itemsToShow = 3;

  const currentVideoIndex = videos.findIndex(v => v.video_id === currentVideoId);
  const relatedVideos = videos
    .filter((_, index) => index !== currentVideoIndex)
    .slice(0, 6); // Show up to 6 related videos

  const handleScroll = (direction: "left" | "right") => {
    const newPosition = direction === "left" 
      ? Math.max(0, scrollPosition - itemsToShow)
      : Math.min(relatedVideos.length - itemsToShow, scrollPosition + itemsToShow);
    setScrollPosition(newPosition);
  };

  if (relatedVideos.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-900/50 p-4 rounded-xl backdrop-blur-sm">
      <h2 className="text-white text-lg font-semibold mb-4">Related Videos</h2>
      <div className="relative">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll("left")}
            disabled={scrollPosition === 0}
            className="text-white"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="flex-1 overflow-hidden">
            <div 
              className="flex gap-4 transition-transform duration-300"
              style={{ transform: `translateX(-${scrollPosition * (100 / itemsToShow)}%)` }}
            >
              {relatedVideos.map((video, index) => {
                const originalIndex = videos.findIndex(v => v.video_id === video.video_id);
                return (
                  <button
                    key={video.video_id}
                    onClick={() => onVideoSelect(originalIndex)}
                    className="flex-shrink-0 w-[calc(100%/3-1rem)] aspect-video bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-white/20 transition-all"
                    aria-label={`Play video ${video["Description/Title"] || "Untitled"}`}
                  >
                    <div className="w-full h-full bg-gray-800 relative group">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.video_id.split(':')[1]}?controls=0`}
                        className="w-full h-full pointer-events-none"
                        title={video["Description/Title"] || "Video thumbnail"}
                      />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll("right")}
            disabled={scrollPosition >= relatedVideos.length - itemsToShow}
            className="text-white"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RelatedVideos;
