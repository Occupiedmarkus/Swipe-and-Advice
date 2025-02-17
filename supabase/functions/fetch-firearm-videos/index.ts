
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

const MAX_DAILY_VIDEOS = 5; // Changed to 5 videos per day

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get today's video count
    const { data: countData, error: countError } = await supabaseClient.rpc('get_todays_video_count');
    
    if (countError) {
      throw new Error(`Error getting daily count: ${countError.message}`);
    }

    const todayCount = countData || 0;
    console.log(`Current daily video count: ${todayCount}`);

    if (todayCount >= MAX_DAILY_VIDEOS) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Daily video limit reached. Try again tomorrow." 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    // Calculate how many more videos we can add today
    const remainingVideos = MAX_DAILY_VIDEOS - todayCount;

    // Fetch more videos than needed to account for duplicates
    const [youtubeVideos, vimeoVideos] = await Promise.all([
      fetchYoutubeVideos(),
      fetchVimeoVideos()
    ]);

    // Check for duplicates and filter them out
    const existingVideos = new Set();
    const filteredVideos = [...youtubeVideos, ...vimeoVideos].filter(async (video) => {
      const { data: isDuplicate } = await supabaseClient.rpc('is_duplicate_video', { video_id_param: video.video_id });
      if (isDuplicate) return false;
      if (existingVideos.has(video.video_id)) return false;
      existingVideos.add(video.video_id);
      return true;
    });

    // Shuffle and take only what we need
    const videosToAdd = filteredVideos
      .sort(() => Math.random() - 0.5)
      .slice(0, remainingVideos);

    if (videosToAdd.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No new unique videos found. Try again later." 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert videos into database
    const { error: insertError } = await supabaseClient
      .from('videos')
      .insert(videosToAdd);

    if (insertError) throw insertError;

    // Update today's count
    const { error: updateError } = await supabaseClient
      .from('video_daily_counts')
      .upsert({
        date: new Date().toISOString().split('T')[0],
        count: todayCount + videosToAdd.length
      });

    if (updateError) {
      console.error('Error updating daily count:', updateError);
    }

    // Get the last fetch time
    const { data: lastFetchTime } = await supabaseClient.rpc('get_last_fetch_time');

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: videosToAdd.length,
        dailyTotal: todayCount + videosToAdd.length,
        lastFetchTime,
        nextFetchAvailable: todayCount + videosToAdd.length >= MAX_DAILY_VIDEOS ? 
          new Date(new Date().setHours(24, 0, 0, 0)).toISOString() : null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
