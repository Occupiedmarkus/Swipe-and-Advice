
import { supabase } from "@/integrations/supabase/client";

export type Video = {
  id: number;
  video_id: string;
  created_at: string;
  category: string;
  user_id: string | null;
};

export type Comment = {
  id: number;
  video_id: string;
  text: string;
  created_at: string;
};

export { supabase };

