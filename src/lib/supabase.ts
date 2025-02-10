
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://MISSING_PROJECT_URL';
const supabaseKey = 'MISSING_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Video = {
  id: number;
  video_id: string;
  created_at: string;
  category: string;
};

export type Comment = {
  id: number;
  video_id: string;
  text: string;
  created_at: string;
};
