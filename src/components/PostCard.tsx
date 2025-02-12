
import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PostCardProps {
  videoId: string;
  onSwipe: (direction: "left" | "right") => void;
  showComments: boolean;
  onToggleComments: () => void;
}

const PostCard = ({ videoId, onSwipe, showComments, onToggleComments }: PostCardProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      onSwipe(diff > 0 ? "left" : "right");
    }
    setTouchStart(null);
  };

  const getVideoEmbedUrl = (videoId: string) => {
    const [platform, id] = videoId.split(':');
    
    switch (platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${id}`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${id}`;
      case 'dailymotion':
        return `https://www.dailymotion.com/embed/video/${id}`;
      case 'facebook':
        return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${id}&show_text=false`;
      default:
        // For legacy videos (assuming they're YouTube)
        return `https://www.youtube.com/embed/${videoId}`;
    }
  };

  return (
    <Card className="relative w-full max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300">
      <div
        className="relative aspect-video"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <iframe
          src={getVideoEmbedUrl(videoId)}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="Video player"
        />
      </div>
      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => onSwipe("right")}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Previous post"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={onToggleComments}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Toggle comments"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        <button
          onClick={() => onSwipe("left")}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Next post"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </Card>
  );
};

export default PostCard;
