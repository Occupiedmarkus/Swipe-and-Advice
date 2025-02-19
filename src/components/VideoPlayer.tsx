
import { useState } from "react";
import PostCard from "@/components/PostCard";
import Comments from "@/components/Comments";
import { Video } from "@/lib/supabase";

interface VideoPlayerProps {
  videos: Video[];
  currentVideo: Video | undefined;
  currentIndex: number;
  onSwipe: (direction: "left" | "right") => void;
  setCurrentIndex: (index: number) => void;
}

const VideoPlayer = ({
  videos,
  currentVideo,
  currentIndex,
  onSwipe,
  setCurrentIndex
}: VideoPlayerProps) => {
  const [showComments, setShowComments] = useState(false);

  if (!currentVideo) return null;

  return (
    <>
      <PostCard
        videoId={currentVideo.video_id}
        onSwipe={onSwipe}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
      />

      {showComments && (
        <Comments videoId={currentVideo.video_id} />
      )}
    </>
  );
};

export default VideoPlayer;
