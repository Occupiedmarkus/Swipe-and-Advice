
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import SearchBar from "@/components/SearchBar";

interface HeaderProps {
  currentIndex: number;
  totalVideos: number;
  currentUser: string | null;
  videoUserId?: string;
  onDelete: () => void;
  onSwipe: (direction: "left" | "right") => void;
  onSearch: (query: string) => void;
}

const Header = ({
  currentIndex,
  totalVideos,
  currentUser,
  videoUserId,
  onDelete,
  onSwipe,
  onSearch,
}: HeaderProps) => {
  return (
    <div className="max-w-3xl mx-auto text-center mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <img 
            src="/6-holes.png" 
            alt="Six Holes Logo" 
            className="h-16 w-16 object-contain hover:scale-110 transition-transform duration-300" 
            loading="eager"
          />
          <div className="text-left">
            <h1 className="text-3xl font-semibold text-white">Swipe & Advice</h1>
            <p className="text-gray-400 text-sm">Video {currentIndex + 1} of {totalVideos}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentUser && videoUserId === currentUser && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="text-white hover:scale-105 transition-transform duration-300"
              aria-label="Delete current video"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Video
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <SearchBar onSearch={onSearch} />
      </div>

      <div className="space-y-2 bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
        <p className="text-gray-300">Use arrow keys or swipe to navigate videos</p>
        <p className="text-gray-400 text-sm">*you can only advise once</p>
        <div className="flex justify-center gap-4 mt-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSwipe("right")}
            className="text-white"
            aria-label="Previous video"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSwipe("left")}
            className="text-white"
            aria-label="Next video"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;
