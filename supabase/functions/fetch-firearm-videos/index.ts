
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

const MAX_DAILY_VIDEOS = 5;

function validateRequestHeaders(req: Request): boolean {
  const headers = req.headers;
  
  const hasContentLength = headers.has('content-length');
  const hasTransferEncoding = headers.has('transfer-encoding');
  
  if (hasContentLength && hasTransferEncoding) {
    console.error('Security warning: Request contained both Content-Length and Transfer-Encoding headers');
    return false;
  }
  
  return true;
}

function validateUrlPath(url: string | URL): boolean {
  let path: string;
  
  if (url instanceof URL) {
    path = url.pathname;
  } else if (typeof url === 'string') {
    try {
      // Try to parse as full URL first
      const parsedUrl = new URL(url);
      path = parsedUrl.pathname;
    } catch {
      // If parsing fails, assume it's just a path
      path = url;
    }
  } else {
    console.error('Invalid URL type provided');
    return false;
  }
  
  // Check for path traversal sequences
  const hasTraversal = path.includes('../') || 
                       path.includes('..\\') || 
                       path.includes('/..');
                       
  if (hasTraversal) {
    console.error('Security warning: Path traversal attempt detected');
    return false;
  }
  
  return true;
}

async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
  // Validate URL to prevent path traversal attacks
  if (!validateUrlPath(url)) {
    throw new Error('Invalid URL: Path traversal attempt detected');
  }
  
  // Validate headers
  if (options?.headers) {
    const headers = new Headers(options.headers);
    if (headers.has('content-length') && headers.has('transfer-encoding')) {
      throw new Error('Invalid headers: Cannot have both Content-Length and Transfer-Encoding');
    }
  }
  
  return await fetch(url, options);
}

async function fetchYoutubeVideos() {
  try {
    const keyword = FIREARMS_KEYWORDS[Math.floor(Math.random() * FIREARMS_KEYWORDS.length)];
    console.log(`Fetching YouTube videos with keyword: ${keyword}`);
    
    const response = await secureFetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`YouTube API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log("No YouTube videos found");
      return [];
    }
    
    console.log(`Found ${data.items.length} YouTube videos`);
    
    return data.items.map((item) => ({
      video_id: `youtube:${item.id.videoId}`,
      "Description/Title": item.snippet.title,
      created_at: new Date().toISOString(),
      Source: "Youtube", // Exact match with SourceTypes table
      tags: ["firearm", "training", "education"]
    }));
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
}

async function fetchVimeoVideos() {
  try {
    const keyword = FIREARMS_KEYWORDS[Math.floor(Math.random() * FIREARMS_KEYWORDS.length)];
    console.log(`Fetching Vimeo videos with keyword: ${keyword}`);
    
    const response = await secureFetch(
      `https://api.vimeo.com/videos?query=${encodeURIComponent(keyword)}&per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vimeo API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log("No Vimeo videos found");
      return [];
    }
    
    console.log(`Found ${data.data.length} Vimeo videos`);
    
    return data.data.map((item) => ({
      video_id: `vimeo:${item.uri.split('/').pop()}`,
      "Description/Title": item.name,
      created_at: new Date().toISOString(),
      Source: "Vimeo", // Exact match with SourceTypes table
      tags: ["firearm", "training", "education"]
    }));
  } catch (error) {
    console.error("Error fetching Vimeo videos:", error);
    return [];
  }
}

serve(async (req) => {
  // Validate request for path traversal attempts
  const url = new URL(req.url);
  if (!validateUrlPath(url)) {
    return new Response(
      JSON.stringify({ error: 'Invalid URL detected: path traversal attempt' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  
  if (!validateRequestHeaders(req)) {
    return new Response(
      JSON.stringify({ error: 'Invalid HTTP headers detected' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Edge function called: fetch-firearm-videos");

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error("No authorization header provided");
    return new Response(
      JSON.stringify({ error: 'No authorization header' }),
      { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`User authenticated: ${user.id}`);

    const { data: countData, error: countError } = await supabaseClient.rpc('get_todays_video_count');
    
    if (countError) {
      console.error("Error getting daily count:", countError);
      throw new Error(`Error getting daily count: ${countError.message}`);
    }

    const todayCount = countData || 0;
    console.log(`Current daily video count: ${todayCount}`);

    if (todayCount >= MAX_DAILY_VIDEOS) {
      console.log("Daily video limit reached");
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

    const remainingVideos = MAX_DAILY_VIDEOS - todayCount;
    console.log(`Remaining video quota for today: ${remainingVideos}`);

    const [youtubeVideos, vimeoVideos] = await Promise.all([
      fetchYoutubeVideos(),
      fetchVimeoVideos()
    ]);

    if (youtubeVideos.length === 0 && vimeoVideos.length === 0) {
      console.log("No videos found from either source");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No videos found from the sources. Try again later." 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    const { data: existingVideoIds, error: existingError } = await supabaseClient
      .from('videos')
      .select('video_id');

    if (existingError) {
      console.error("Error fetching existing video IDs:", existingError);
      throw new Error(`Error fetching existing video IDs: ${existingError.message}`);
    }

    const existingIds = new Set(existingVideoIds.map(v => v.video_id));
    console.log(`Found ${existingIds.size} existing videos in the database`);

    const allVideos = [...youtubeVideos, ...vimeoVideos];
    const uniqueVideos = allVideos.filter(video => !existingIds.has(video.video_id));
    console.log(`After filtering duplicates: ${uniqueVideos.length} unique videos remaining`);

    if (uniqueVideos.length === 0) {
      console.log("No unique videos to add");
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

    const videosToAdd = uniqueVideos
      .sort(() => Math.random() - 0.5)
      .slice(0, remainingVideos);

    console.log(`Adding ${videosToAdd.length} new videos to the database`);

    let successCount = 0;
    for (const video of videosToAdd) {
      try {
        const { error: insertError } = await supabaseClient
          .from('videos')
          .insert([video]);

        if (insertError) {
          console.error(`Error inserting video ${video.video_id}:`, insertError);
          continue; // Skip this video but continue with others
        }
        
        successCount++;
      } catch (error) {
        console.error(`Exception inserting video ${video.video_id}:`, error);
        continue;
      }
    }

    if (successCount === 0) {
      console.log("Failed to insert any videos");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to add any new videos. Try again later." 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const newCount = todayCount + successCount;
    const { error: updateError } = await supabaseClient
      .from('video_daily_counts')
      .upsert({
        date: new Date().toISOString().split('T')[0],
        count: newCount
      });

    if (updateError) {
      console.error('Error updating daily count:', updateError);
      // Continue anyway since videos were added
    }

    const { data: lastFetchTime } = await supabaseClient.rpc('get_last_fetch_time');

    console.log(`Successfully added ${successCount} new videos. New daily count: ${newCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: successCount,
        dailyTotal: newCount,
        lastFetchTime,
        nextFetchAvailable: newCount >= MAX_DAILY_VIDEOS ? 
          new Date(new Date().setHours(24, 0, 0, 0)).toISOString() : null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-firearm-videos function:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
