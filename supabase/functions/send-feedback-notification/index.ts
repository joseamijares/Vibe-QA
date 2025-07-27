import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BrevoClient } from '../_shared/brevo-client.ts';
import { EmailTemplateEngine, EMAIL_TEMPLATES } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedbackNotificationRequest {
  feedbackId: string;
  projectId: string;
  projectName: string;
  feedbackType: string;
  reporterName?: string;
  reporterEmail?: string;
  pageUrl?: string;
  description: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const brevoClient = new BrevoClient(brevoApiKey);

    const body: FeedbackNotificationRequest = await req.json();
    const { 
      feedbackId, 
      projectId, 
      projectName, 
      feedbackType, 
      reporterName, 
      reporterEmail, 
      pageUrl, 
      description 
    } = body;

    // Validate required fields
    if (!feedbackId || !projectId || !projectName || !feedbackType || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get project organization and members with notification preferences
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get organization members who have feedback notifications enabled
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, email_notifications')
      .eq('organization_id', project.organization_id);

    if (membersError) {
      throw new Error('Failed to fetch organization members');
    }

    // Filter members who have feedback notifications enabled
    const notificationRecipients = members.filter(member => 
      member.email_notifications?.feedback !== false
    );

    if (notificationRecipients.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No recipients with notifications enabled' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user emails from auth.users
    const userIds = notificationRecipients.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
      .rpc('get_user_emails', { user_ids: userIds });

    if (usersError || !users) {
      throw new Error('Failed to fetch user emails');
    }

    const baseUrl = Deno.env.get('APP_URL') || 'https://app.vibeqa.com';
    const feedbackLink = `${baseUrl}/dashboard/feedback/${feedbackId}`;

    // Prepare email parameters
    const emailParams = {
      projectName,
      feedbackType: feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1),
      typeColor: EmailTemplateEngine.getFeedbackTypeColor(feedbackType),
      reporterName: reporterName || 'Anonymous',
      reporterEmail: reporterEmail || 'Not provided',
      pageUrl: pageUrl || 'Not specified',
      description: description.length > 200 ? description.substring(0, 200) + '...' : description,
      feedbackLink,
      unsubscribeLink: EmailTemplateEngine.generateUnsubscribeLink(baseUrl, '', 'feedback'),
    };

    // Render the email template
    const renderedTemplate = EmailTemplateEngine.renderTemplate(
      EMAIL_TEMPLATES.feedbackNotification,
      emailParams
    );

    // Send emails to all recipients
    const emailPromises = users.map(async (user: any) => {
      try {
        // Queue the email
        await supabase
          .from('email_queue')
          .insert({
            to_email: user.email,
            to_name: user.email.split('@')[0],
            from_email: 'notifications@vibeqa.com',
            from_name: 'VibeQA',
            subject: renderedTemplate.subject,
            template: 'feedback_notification',
            params: { ...emailParams, unsubscribeLink: EmailTemplateEngine.generateUnsubscribeLink(baseUrl, user.id, 'feedback') },
          });

        // Send immediately
        const result = await brevoClient.sendTransactionalEmail({
          to: [{ email: user.email }],
          sender: { email: 'notifications@vibeqa.com', name: 'VibeQA' },
          subject: renderedTemplate.subject,
          htmlContent: renderedTemplate.htmlContent,
          textContent: renderedTemplate.textContent,
          tags: ['feedback', projectName, feedbackType],
        });

        // Mark as sent
        await supabase
          .from('email_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('to_email', user.email)
          .eq('template', 'feedback_notification')
          .is('sent_at', null);

        return { email: user.email, success: true, messageId: result.messageId };
      } catch (error: any) {
        console.error(`Failed to send email to ${user.email}:`, error);
        
        // Mark as failed in queue
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed', 
            error: error.message,
            attempts: 1,
          })
          .eq('to_email', user.email)
          .eq('template', 'feedback_notification')
          .is('sent_at', null);

        return { email: user.email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Feedback notifications sent to ${successCount}/${results.length} recipients`,
        results,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
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