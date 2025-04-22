import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const VIMEO_ACCESS_TOKEN = Deno.env.get('VIMEO_ACCESS_TOKEN')
const FACEBOOK_ACCESS_TOKEN = Deno.env.get('FACEBOOK_ACCESS_TOKEN')
const DAILYMOTION_CLIENT_ID = Deno.env.get('DAILYMOTION_CLIENT_ID')
const DAILYMOTION_CLIENT_SECRET = Deno.env.get('DAILYMOTION_CLIENT_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FIREARMS_KEYWORDS = [
  "firearm instruction",
  "gun safety", 
  "marksmanship training",
  "tactical shooting",
  "firearms education",
  "pistol techniques",
  "rifle training",
  "shooting fundamentals",
  "concealed carry tips",
  "handgun safety",
  "home defense firearms",
  "long range shooting",
  "competition shooting",
  "firearm maintenance",
  "shooting drills",
  "gun handling basics"
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
      const parsedUrl = new URL(url);
      path = parsedUrl.pathname;
    } catch {
      path = url;
    }
  } else {
    console.error('Invalid URL type provided');
    return false;
  }
  
  const hasTraversal = path.includes('../') || 
                       path.includes('..\\') || 
                       path.includes('/..');
                       
  if (hasTraversal) {
    console.error('Security warning: Path traversal attempt detected');
    return false;
  }
  
  return true;
}

function validateSensitiveFileAccess(url: string | URL): boolean {
  let path: string;
  
  if (url instanceof URL) {
    path = url.pathname.toLowerCase();
  } else if (typeof url === 'string') {
    try {
      const parsedUrl = new URL(url);
      path = parsedUrl.pathname.toLowerCase();
    } catch {
      path = url.toLowerCase();
    }
  } else {
    console.error('Invalid URL type provided');
    return false;
  }
  
  const sensitivePatterns = [
    '/includes/global.inc',
    '/config.',
    '.env',
    '.ini', 
    '.conf',
    '.config',
    '.json',
    '/includes/',
    '/config/',
    '/settings/'
  ];
  
  for (const pattern of sensitivePatterns) {
    if (path.includes(pattern)) {
      console.error(`Security warning: Attempt to access sensitive file detected: ${path}`);
      return false;
    }
  }
  
  return true;
}

async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!validateUrlPath(url)) {
    throw new Error('Invalid URL: Path traversal attempt detected');
  }
  
  if (!validateSensitiveFileAccess(url)) {
    throw new Error('Access to sensitive file denied');
  }
  
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
    const keywordsToUse = [...FIREARMS_KEYWORDS].sort(() => 0.5 - Math.random()).slice(0, 3);
    const keyword = keywordsToUse.join(' OR ');
    console.log(`Fetching YouTube videos with keywords: ${keyword}`);
    
    const response = await secureFetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=15&key=${YOUTUBE_API_KEY}`
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
      Source: "Youtube", 
      tags: ["firearm", "training", "education"]
    }));
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
}

async function fetchVimeoVideos() {
  try {
    const keywordsToUse = [...FIREARMS_KEYWORDS].sort(() => 0.5 - Math.random()).slice(0, 3);
    const keyword = keywordsToUse.join(' OR ');
    console.log(`Fetching Vimeo videos with keywords: ${keyword}`);
    
    const response = await secureFetch(
      `https://api.vimeo.com/videos?query=${encodeURIComponent(keyword)}&per_page=15`,
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
      Source: "Vimeo", 
      tags: ["firearm", "training", "education"]
    }));
  } catch (error) {
    console.error("Error fetching Vimeo videos:", error);
    return [];
  }
}

async function fetchDailymotionVideos() {
  try {
    const keywordsToUse = [...FIREARMS_KEYWORDS].sort(() => 0.5 - Math.random()).slice(0, 3);
    const keyword = keywordsToUse.join(' OR ');
    console.log(`Fetching Dailymotion videos with keywords: ${keyword}`);
    
    const tokenResponse = await secureFetch('https://api.dailymotion.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${DAILYMOTION_CLIENT_ID}&client_secret=${DAILYMOTION_CLIENT_SECRET}`
    });
    
    if (!tokenResponse.ok) {
      console.error('Failed to get Dailymotion access token');
      return [];
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    const response = await secureFetch(
      `https://api.dailymotion.com/videos?search=${encodeURIComponent(keyword)}&limit=15`, 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Dailymotion API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.list || data.list.length === 0) {
      console.log("No Dailymotion videos found");
      return [];
    }
    
    console.log(`Found ${data.list.length} Dailymotion videos`);
    
    return data.list.map((item) => ({
      video_id: `dailymotion:${item.id}`,
      "Description/Title": item.title,
      created_at: new Date().toISOString(),
      Source: "Dailymotion", 
      tags: ["firearm", "training", "education"]
    }));
  } catch (error) {
    console.error("Error fetching Dailymotion videos:", error);
    return [];
  }
}

async function fetchFacebookVideos() {
  try {
    const keywordsToUse = [...FIREARMS_KEYWORDS].sort(() => 0.5 - Math.random()).slice(0, 3);
    const keyword = keywordsToUse.join(' OR ');
    console.log(`Fetching Facebook videos with keywords: ${keyword}`);
    
    const response = await secureFetch(
      `https://graph.facebook.com/v18.0/search?type=video&q=${encodeURIComponent(keyword)}&access_token=${FACEBOOK_ACCESS_TOKEN}`, 
      {
        method: 'GET'
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Facebook API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log("No Facebook videos found");
      return [];
    }
    
    console.log(`Found ${data.data.length} Facebook videos`);
    
    return data.data.map((item) => ({
      video_id: `facebook:${item.id}`,
      "Description/Title": item.description || item.name || "Untitled Video",
      created_at: new Date().toISOString(),
      Source: "Facebook", 
      tags: ["firearm", "training", "education"]
    }));
  } catch (error) {
    console.error("Error fetching Facebook videos:", error);
    return [];
  }
}

serve(async (req) => {
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
  
  if (!validateSensitiveFileAccess(url)) {
    return new Response(
      JSON.stringify({ error: 'Access to sensitive file denied' }),
      { 
        status: 403, 
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

    let allVideos = [];
    let attemptCount = 0;
    const maxAttempts = 3;
    
    while (attemptCount < maxAttempts && allVideos.length < 20) {
      attemptCount++;
      console.log(`Fetch attempt #${attemptCount}`);
      
      const [youtubeVideos, vimeoVideos, dailymotionVideos, facebookVideos] = await Promise.all([
        fetchYoutubeVideos(),
        fetchVimeoVideos(),
        fetchDailymotionVideos(), 
        fetchFacebookVideos()
      ]);
      
      allVideos = [...allVideos, ...youtubeVideos, ...vimeoVideos, ...dailymotionVideos, ...facebookVideos];
    }
    
    console.log(`Total videos fetched after ${attemptCount} attempts: ${allVideos.length}`);

    if (allVideos.length === 0) {
      console.log("No videos found from either source after multiple attempts");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No videos found from the sources. Please try again later or contact support." 
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

    const uniqueVideos = allVideos.filter(video => !existingIds.has(video.video_id));
    console.log(`After filtering duplicates: ${uniqueVideos.length} unique videos remaining`);

    if (uniqueVideos.length === 0) {
      console.log("No unique videos to add after multiple attempts");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No new unique videos found. Our system will automatically try different search criteria next time." 
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
