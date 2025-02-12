
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, Comment } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface CommentsProps {
  videoId: string;
}

const Comments = ({ videoId }: CommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasCommented, setHasCommented] = useState(false);
  const { toast } = useToast();

  const checkExistingComment = async (ip: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .eq('ip_address', ip)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing comment:', error);
      return false;
    }

    return !!data;
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP:', error);
      return null;
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
      return;
    }

    setComments(data || []);
    
    // Check if user has already commented
    const ip = await getClientIP();
    if (ip) {
      const commented = await checkExistingComment(ip);
      setHasCommented(commented);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const ip = await getClientIP();
    if (!ip) {
      toast({
        title: "Error",
        description: "Could not determine your IP address",
        variant: "destructive",
      });
      return;
    }

    const hasExistingComment = await checkExistingComment(ip);
    if (hasExistingComment) {
      toast({
        title: "Comment Limit Reached",
        description: "You can only post one comment per video",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('comments')
      .insert([
        {
          video_id: videoId,
          text: newComment,
          ip_address: ip,
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: "Comment Limit Reached",
          description: "You can only post one comment per video",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to post comment",
          variant: "destructive",
        });
      }
      return;
    }

    setNewComment("");
    setHasCommented(true);
    fetchComments();
    toast({
      title: "Success",
      description: "Comment posted successfully",
    });
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
      {!hasCommented ? (
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
      ) : (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">You have already commented on this video.</p>
        </div>
      )}
      <div className="space-y-4">
        {displayedComments.map((comment) => (
          <div key={comment.id} className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300">{comment.text}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(comment.created_at).toLocaleString()}
            </p>
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
