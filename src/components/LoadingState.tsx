
import { Skeleton } from "@/components/ui/skeleton";

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center text-white space-y-4">
      <Skeleton className="w-full max-w-3xl h-[60vh] rounded-xl bg-gray-800/50" />
      <div className="w-full max-w-3xl space-y-4">
        <Skeleton className="h-12 w-48 bg-gray-800/50" />
        <Skeleton className="h-24 w-full bg-gray-800/50" />
      </div>
      <span className="sr-only">Loading content...</span>
    </div>
  );
};

export default LoadingState;
