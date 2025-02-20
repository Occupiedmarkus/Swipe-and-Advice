
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight, Plus, LogIn } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

interface HeaderProps {
  currentIndex: number;
  totalVideos: number;
  currentUser: string | null;
  videoUserId?: string;
  onDelete: () => void;
  onSwipe: (direction: "left" | "right") => void;
  onFetchNew?: () => void;
  dailyStats?: {
    count: number;
    lastFetchTime: string | null;
    nextFetchAvailable: string | null;
  };
}

const Header = ({
  currentIndex,
  totalVideos,
  currentUser,
  videoUserId,
  onDelete,
  onSwipe,
  onFetchNew,
  dailyStats,
}: HeaderProps) => {
  const { isAdmin } = useAdmin();
  const canFetchMore = dailyStats && dailyStats.count < 5;
  const lastFetchTimeFormatted = dailyStats?.lastFetchTime
    ? formatDistanceToNow(new Date(dailyStats.lastFetchTime), { addSuffix: true })
    : null;

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
          {!currentUser && (
            <Button
              variant="outline"
              asChild
              className="text-white"
            >
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Admin Login
              </Link>
            </Button>
          )}
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

      {isAdmin && (
        <div className="space-y-2 bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-300">Daily video stats: {dailyStats?.count || 0}/5 videos added today</p>
            {onFetchNew && (
              <Button
                variant="outline"
                onClick={onFetchNew}
                disabled={!canFetchMore}
                className="text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Fetch New Videos
                {canFetchMore ? ` (${5 - (dailyStats?.count || 0)} remaining)` : ''}
              </Button>
            )}
          </div>
          {lastFetchTimeFormatted && (
            <p className="text-gray-400 text-sm">Last fetch: {lastFetchTimeFormatted}</p>
          )}
          {dailyStats?.nextFetchAvailable && (
            <p className="text-gray-400 text-sm">
              Next fetch available: {formatDistanceToNow(new Date(dailyStats.nextFetchAvailable), { addSuffix: true })}
            </p>
          )}
          <p className="text-gray-300">Use arrow keys or swipe to navigate videos</p>
        </div>
      )}

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
  );
};

export default Header;
