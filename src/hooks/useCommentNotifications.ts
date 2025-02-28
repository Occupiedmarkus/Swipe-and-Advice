
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "./useAdmin";
import { Comment } from "@/lib/supabase";

export const useCommentNotifications = () => {
  const [notifications, setNotifications] = useState<Comment[]>([]);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    // Only admins should get notifications
    if (isAdminLoading || !isAdmin) return;

    // Subscribe to real-time comment inserts
    const channel = supabase
      .channel('public:comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          const newComment = payload.new as Comment;
          
          // Add to notifications
          setNotifications((prev) => [newComment, ...prev]);
          setNewCommentsCount((prev) => prev + 1);
          
          // Show toast notification
          toast({
            title: "New Comment",
            description: `New comment on video: "${newComment.video_id.substring(0, 10)}..."`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, isAdminLoading, toast]);

  // Method to clear notifications count
  const clearNotifications = () => {
    setNewCommentsCount(0);
  };

  return { 
    notifications, 
    newCommentsCount, 
    clearNotifications 
  };
};
