
import { supabase } from "@/integrations/supabase/client";

export type Video = {
  id: number;
  video_id: string;
  created_at: string;
  "Description/Title"?: string;
  Source?: string;
  user_id?: string;
};

export type Comment = {
  id: number;
  video_id: string;
  text: string;
  created_at: string;
  ip_address: string;
};

export { supabase };
