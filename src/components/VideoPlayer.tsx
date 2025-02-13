
import { useState } from "react";
import PostCard from "@/components/PostCard";
import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
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
    </>
  );
};

export default VideoPlayer;
