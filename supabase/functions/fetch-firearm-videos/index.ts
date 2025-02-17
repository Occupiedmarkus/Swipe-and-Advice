
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const VIMEO_ACCESS_TOKEN = Deno.env.get('VIMEO_ACCESS_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FIREARMS_KEYWORDS = [
  "firearm instruction",
  "gun safety",
  "marksmanship training",
  "tactical shooting",
  "firearms education"
];

async function fetchYoutubeVideos() {
  const keyword = FIREARMS_KEYWORDS[Math.floor(Math.random() * FIREARMS_KEYWORDS.length)];
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
  );
  const data = await response.json();
  
  return data.items.map((item: any) => ({
    video_id: `youtube:${item.id.videoId}`,
    "Description/Title": item.snippet.title,
    created_at: new Date().toISOString(),
    Source: "Youtube",
    tags: ["firearm", "training", "education"]
  }));
}

async function fetchVimeoVideos() {
  const keyword = FIREARMS_KEYWORDS[Math.floor(Math.random() * FIREARMS_KEYWORDS.length)];
  const response = await fetch(
    `https://api.vimeo.com/videos?query=${encodeURIComponent(keyword)}&per_page=10`,
    {
      headers: {
        'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`
      }
    }
  );
  const data = await response.json();
  
  return data.data.map((item: any) => ({
    video_id: `vimeo:${item.uri.split('/').pop()}`,
    "Description/Title": item.name,
    created_at: new Date().toISOString(),
    Source: "Vimeo",
    tags: ["firearm", "training", "education"]
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Fetch videos from both platforms
    const [youtubeVideos, vimeoVideos] = await Promise.all([
      fetchYoutubeVideos(),
      fetchVimeoVideos()
    ]);

    // Combine and shuffle the videos
    const allVideos = [...youtubeVideos, ...vimeoVideos]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10); // Limit to 10 videos total

    // Insert videos into Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseClient
      .from('videos')
      .insert(allVideos);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: allVideos.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
