import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { StorageUtils, MediaUpload } from '../_shared/storage-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-project-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get project key from header
    const projectKey = req.headers.get('X-Project-Key');
    if (!projectKey) {
      return new Response(
        JSON.stringify({ error: 'Project key is required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const storageUtils = new StorageUtils(supabaseUrl, supabaseServiceKey);

    // Validate project key and get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, organization_id, name, allowed_domains, is_active')
      .eq('api_key', projectKey)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Invalid project key' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!project.is_active) {
      return new Response(
        JSON.stringify({ error: 'Project is not active' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request based on content type
    let feedbackData: any = {};
    let mediaUploads: MediaUpload[] = [];

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data with files
      const formData = await req.formData();
      
      // Extract feedback data
      const dataField = formData.get('data');
      if (dataField) {
        // Handle both string and File objects
        if (typeof dataField === 'string') {
          feedbackData = JSON.parse(dataField);
        } else if (dataField instanceof File) {
          // Read file content as text
          feedbackData = JSON.parse(await dataField.text());
        }
      }
      
      // Extract media files
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && key !== 'data') {
          let type: 'screenshot' | 'voice' = 'screenshot';
          
          if (key.startsWith('screenshot')) {
            type = 'screenshot';
          } else if (key.startsWith('recording')) {
            type = 'voice';
          }

          // Validate file size (10MB limit)
          if (!storageUtils.validateFileSize(value, 10)) {
            return new Response(
              JSON.stringify({ error: `File ${value.name} exceeds 10MB limit` }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          // Validate file type
          if (!storageUtils.validateFileType(value, type)) {
            return new Response(
              JSON.stringify({ error: `Invalid file type for ${value.name}` }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          mediaUploads.push({
            fieldName: key,
            file: value,
            type,
          });
        }
      }

      // Limit to 5 attachments
      if (mediaUploads.length > 5) {
        return new Response(
          JSON.stringify({ error: 'Maximum 5 attachments allowed' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // Handle regular JSON
      feedbackData = await req.json();
    }

    // Validate domain if configured
    if (project.allowed_domains && project.allowed_domains.length > 0) {
      const origin = req.headers.get('Origin') || '';
      const pageUrl = feedbackData.pageUrl || '';
      const url = origin ? new URL(origin) : new URL(pageUrl);
      const domain = url.hostname;
      const domainWithPort = url.host; // includes port if present

      const isAllowed = project.allowed_domains.some((allowedDomain: string) => {
        // Support wildcards like *.example.com
        if (allowedDomain.startsWith('*.')) {
          const baseDomain = allowedDomain.slice(2);
          return domain.endsWith(baseDomain);
        }
        // Check both hostname and hostname:port formats
        return domain === allowedDomain || domainWithPort === allowedDomain;
      });

      if (!isAllowed) {
        return new Response(
          JSON.stringify({ error: 'Domain not allowed' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate required fields
    if (!feedbackData.type || !feedbackData.description) {
      return new Response(
        JSON.stringify({ error: 'Type and description are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create feedback entry
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        project_id: project.id,
        type: feedbackData.type,
        title: feedbackData.title,
        description: feedbackData.description,
        reporter_email: feedbackData.reporterEmail,
        reporter_name: feedbackData.reporterName,
        page_url: feedbackData.pageUrl,
        user_agent: feedbackData.userAgent,
        browser_info: feedbackData.browserInfo,
        device_info: feedbackData.deviceInfo,
        custom_data: feedbackData.customData,
        status: 'new',
        priority: 'medium',
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Feedback creation error:', feedbackError);
      return new Response(
        JSON.stringify({ error: 'Failed to create feedback' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Upload media files if any
    let uploadedMedia = [];
    if (mediaUploads.length > 0) {
      console.log(`[submit-feedback] Uploading ${mediaUploads.length} media files...`);
      
      try {
        uploadedMedia = await storageUtils.uploadMedia(
          feedback.id,
          project.organization_id,
          mediaUploads
        );
        
        console.log(`[submit-feedback] Successfully uploaded ${uploadedMedia.length} files`);

        // Create media records in database
        if (uploadedMedia.length > 0) {
          await storageUtils.createMediaRecords(feedback.id, uploadedMedia);
          console.log(`[submit-feedback] Created media records in database`);
        }
      } catch (uploadError) {
        console.error('[submit-feedback] Media upload error:', uploadError);
        // Continue with submission even if media upload fails
      }
    }

    // Trigger email notification
    try {
      const notificationPayload = {
        feedbackId: feedback.id,
        projectId: project.id,
        projectName: project.name,
        feedbackType: feedback.type,
        reporterName: feedback.reporter_name,
        reporterEmail: feedback.reporter_email,
        pageUrl: feedback.page_url,
        description: feedback.description,
      };

      // Call the email notification Edge Function
      const notificationUrl = `${supabaseUrl}/functions/v1/send-feedback-notification`;
      const notificationResponse = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(notificationPayload),
      });

      if (!notificationResponse.ok) {
        console.error('Failed to send notification:', await notificationResponse.text());
      }
    } catch (notificationError) {
      // Log but don't fail the request if notification fails
      console.error('Notification error:', notificationError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        id: feedback.id,
        message: 'Feedback submitted successfully',
        mediaUploaded: uploadedMedia.length,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Submit feedback error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});