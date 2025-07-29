import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected paths: /serve-widget/v1.0.0 or /serve-widget/production or /serve-widget/latest
    if (pathParts.length < 2) {
      return new Response('Invalid path. Use /serve-widget/{version|channel}', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const versionOrChannel = pathParts[1];
    
    // Initialize Supabase client with anon key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Determine the storage path
    let storagePath: string;
    
    // Check if it's a version (starts with 'v')
    if (versionOrChannel.startsWith('v')) {
      storagePath = `${versionOrChannel}/widget.js`;
    } else if (['production', 'staging', 'beta', 'latest'].includes(versionOrChannel)) {
      storagePath = `${versionOrChannel}/widget.js`;
    } else {
      return new Response('Invalid version or channel', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Download widget from storage
    const { data, error } = await supabase.storage
      .from('widget-assets')
      .download(storagePath);

    if (error || !data) {
      console.error('Storage error:', error);
      return new Response('Widget not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Convert blob to text
    const widgetContent = await data.text();

    // Set appropriate cache headers based on version type
    const cacheControl = versionOrChannel.startsWith('v')
      ? 'public, max-age=31536000, immutable' // Versioned files are immutable
      : 'public, max-age=300, s-maxage=300'; // Channels have shorter cache

    // Return the widget with appropriate headers
    return new Response(widgetContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
        'X-Widget-Version': versionOrChannel,
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('Error serving widget:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});

// Edge function configuration
export const config = {
  // Cached at edge for better performance
  cache: {
    maxAge: 300, // 5 minutes at edge
    sMaxAge: 86400, // 24 hours at origin
  },
};