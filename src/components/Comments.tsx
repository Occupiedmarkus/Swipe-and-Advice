
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

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

  return (
    <Card className="w-full max-w-3xl mx-auto mt-4 p-4 bg-white shadow-lg rounded-xl animate-fade-in">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-grow resize-none"
          rows={2}
        />
        <Button type="submit" size="icon" className="self-end">
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{comment.text}</p>
            <p className="text-xs text-gray-400 mt-1">{comment.timestamp}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Comments;
