
import { useEffect } from "react";
import Header from "@/components/Header";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import VideoPlayer from "@/components/VideoPlayer";
import { useVideos } from "@/hooks/useVideos";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const {
    videos,
    currentIndex,
    isLoading,
    currentVideo,
    fetchVideos,
    fetchNewVideos,
    handleDeleteVideo,
    handleSwipe,
    setCurrentIndex,
    dailyStats
  } = useVideos();

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!isMobile) return; // Only add keyboard controls on mobile

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleSwipe("right");
      } else if (e.key === "ArrowRight") {
        handleSwipe("left");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, videos.length, isMobile]);

  if (isLoading) return <LoadingState />;
  if (videos.length === 0) return <EmptyState />;

  return (
    <div className="min-h-screen bg-black p-4 space-y-4 animate-fade-in">
      <Header
        currentIndex={currentIndex}
        totalVideos={videos.length}
        currentUser={currentUser}
        videoUserId={currentVideo?.user_id}
        onDelete={() => handleDeleteVideo(currentUser)}
        onSwipe={handleSwipe}
        onFetchNew={fetchNewVideos}
        dailyStats={dailyStats}
      />
      
      <VideoPlayer
        videos={videos}
        currentVideo={currentVideo}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
        setCurrentIndex={setCurrentIndex}
      />
    </div>
  );
};

export default Index;
