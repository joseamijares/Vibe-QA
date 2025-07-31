import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with the request JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user has superadmin role
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has superadmin role
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Superadmin only.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate system metrics
    const metrics = await calculateSystemMetrics(supabase);

    // Record metrics
    const { error: insertError } = await supabase
      .from('system_metrics')
      .insert(metrics);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        metrics_recorded: metrics.length 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error recording metrics:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function calculateSystemMetrics(supabase: any) {
  const metrics = [];
  const now = new Date().toISOString();

  // Get active users count (users who logged in today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: activeUsers } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true })
    .gte('last_sign_in_at', today.toISOString());

  metrics.push({
    metric_type: 'usage',
    metric_name: 'active_users',
    metric_value: activeUsers || 0,
    unit: 'count',
    recorded_at: now
  });

  // Get feedback submissions count for today
  const { count: feedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  metrics.push({
    metric_type: 'usage',
    metric_name: 'feedback_submissions',
    metric_value: feedbackCount || 0,
    unit: 'count',
    recorded_at: now
  });

  // Get storage usage
  const { data: storageData } = await supabase
    .storage
    .from('feedback-media')
    .list('', { limit: 1000 });

  const storageSize = storageData?.reduce((total, file) => total + (file.metadata?.size || 0), 0) || 0;
  const storageMB = storageSize / (1024 * 1024);

  metrics.push({
    metric_type: 'storage',
    metric_name: 'storage_usage',
    metric_value: storageMB,
    unit: 'MB',
    recorded_at: now
  });

  // Mock CPU and memory metrics (in production, these would come from server monitoring)
  metrics.push(
    {
      metric_type: 'performance',
      metric_name: 'cpu_usage',
      metric_value: Math.random() * 30 + 20, // Random between 20-50%
      unit: 'percent',
      recorded_at: now
    },
    {
      metric_type: 'performance',
      metric_name: 'memory_usage',
      metric_value: Math.random() * 20 + 40, // Random between 40-60%
      unit: 'percent',
      recorded_at: now
    }
  );

  // API calls count (mock data - in production, track via middleware)
  metrics.push({
    metric_type: 'usage',
    metric_name: 'api_calls',
    metric_value: Math.floor(Math.random() * 1000 + 500),
    unit: 'count',
    recorded_at: now
  });

  return metrics;
}