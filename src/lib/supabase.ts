
import { supabase } from "@/integrations/supabase/client";

export type Video = {
  id?: number;  // Made optional since it's auto-generated
  video_id: string;
  created_at: string;
  "Description/Title"?: string;
  Source?: string;
  user_id?: string;
  tags?: string[];  // Added tags to match the schema
};

export type Comment = {
  id: number;
  video_id: string;
  text: string;
  created_at: string;
  ip_address: string;
};

export { supabase };
