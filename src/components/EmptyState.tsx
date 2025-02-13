
const EmptyState = () => {
  return (
    <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center text-white space-y-4">
      <p className="text-xl" role="status">No videos available</p>
      <p className="text-gray-400">Check back later for new content!</p>
    </div>
  );
};

export default EmptyState;
