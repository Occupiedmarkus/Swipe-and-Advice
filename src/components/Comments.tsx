
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ChevronLeft, ChevronRight } from "lucide-react";

interface Comment {
  id: number;
  text: string;
  timestamp: string;
}

interface CommentsProps {
  videoId: string;
}

const Comments = ({ videoId }: CommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      text: newComment,
      timestamp: new Date().toLocaleString(),
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  const commentsPerPage = 3;
  const pageCount = Math.ceil(comments.length / commentsPerPage);
  const startIndex = currentPage * commentsPerPage;
  const displayedComments = comments.slice(startIndex, startIndex + commentsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-4 p-4 bg-gray-900 text-white shadow-lg rounded-xl animate-fade-in">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-grow resize-none bg-gray-800 text-white border-gray-700"
          rows={2}
        />
        <Button type="submit" size="icon" className="self-end">
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <div className="space-y-4">
        {displayedComments.map((comment) => (
          <div key={comment.id} className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300">{comment.text}</p>
            <p className="text-xs text-gray-500 mt-1">{comment.timestamp}</p>
          </div>
        ))}
      </div>
      {comments.length > commentsPerPage && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-gray-400">
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= pageCount - 1}
            className="text-gray-400 hover:text-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default Comments;
