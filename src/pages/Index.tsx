
import { useState } from "react";
import PostCard from "@/components/PostCard";
import Comments from "@/components/Comments";
import { useToast } from "@/components/ui/use-toast";

// Sample video IDs - replace with your actual content source
const sampleVideoIds = [
  "dQw4w9WgXcQ",
  "jNQXAC9IVRw",
  "Y8Wp3dafaMQ",
];

const Index = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

  const handleSwipe = (direction: "left" | "right") => {
    const newIndex =
      direction === "left"
        ? (currentIndex + 1) % sampleVideoIds.length
        : (currentIndex - 1 + sampleVideoIds.length) % sampleVideoIds.length;
    setCurrentIndex(newIndex);
    setShowComments(false);
  };

  return (
    <div className="min-h-screen bg-black p-4 space-y-4">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-semibold text-white mb-2">Swipe & Comment</h1>
        <p className="text-gray-400">Swipe left or right to explore content</p>
      </div>
      
      <PostCard
        videoId={sampleVideoIds[currentIndex]}
        onSwipe={handleSwipe}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
      />
      
      {showComments && (
        <Comments videoId={sampleVideoIds[currentIndex]} />
      )}
    </div>
  );
};

export default Index;
