import { supabase } from '@/lib/supabase';
import { FeedbackSubmission } from '@/widget/types';

export async function handleWidgetFeedback(request: Request): Promise<Response> {
  // CORS headers for widget
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Project-Key',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Get project key from header
    const projectKey = request.headers.get('X-Project-Key');
    if (!projectKey) {
      return new Response(JSON.stringify({ error: 'Project key is required' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Parse request body
    const submission: FeedbackSubmission = await request.json();

    // Validate project key and get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, organization_id, allowed_domains, is_active')
      .eq('api_key', projectKey)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Invalid project key' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    if (!project.is_active) {
      return new Response(JSON.stringify({ error: 'Project is not active' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Validate domain if configured
    if (project.allowed_domains && project.allowed_domains.length > 0) {
      const origin = request.headers.get('Origin') || '';
      const domain = new URL(origin || submission.pageUrl).hostname;

      const isAllowed = project.allowed_domains.some((allowedDomain: string) => {
        // Support wildcards like *.example.com
        if (allowedDomain.startsWith('*.')) {
          const baseDomain = allowedDomain.slice(2);
          return domain.endsWith(baseDomain);
        }
        return domain === allowedDomain;
      });

      if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
          status: 403,
          headers: corsHeaders,
        });
      }
    }

    // Create feedback entry
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        project_id: project.id,
        type: submission.type,
        title: submission.title,
        description: submission.description,
        reporter_email: submission.reporterEmail,
        reporter_name: submission.reporterName,
        page_url: submission.pageUrl,
        user_agent: submission.userAgent,
        browser_info: submission.browserInfo,
        device_info: submission.deviceInfo,
        custom_data: submission.customData,
        status: 'new',
        priority: 'medium',
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Feedback creation error:', feedbackError);
      return new Response(JSON.stringify({ error: 'Failed to create feedback' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // TODO: Handle media attachments
    if (submission.attachments) {
      // Upload screenshots, recordings, etc. to Supabase Storage
      // Create feedback_media entries
    }

    // TODO: Send notification emails
    // This would trigger the email notification system we built

    return new Response(
      JSON.stringify({
        success: true,
        id: feedback.id,
        message: 'Feedback submitted successfully',
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Widget feedback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
