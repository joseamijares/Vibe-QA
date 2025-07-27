import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BrevoClient } from '../_shared/brevo-client.ts';
import { EmailTemplateEngine, EMAIL_TEMPLATES } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  invitationId: string;
  email: string;
  organizationName: string;
  inviterName: string;
  recipientName?: string;
  role: string;
  expiryDate: string;
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

    const body: InvitationEmailRequest = await req.json();
    const { invitationId, email, organizationName, inviterName, recipientName, role, expiryDate } = body;

    // Validate required fields
    if (!invitationId || !email || !organizationName || !inviterName || !role || !expiryDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate accept invitation link
    const baseUrl = Deno.env.get('APP_URL') || 'https://app.vibeqa.com';
    const acceptLink = `${baseUrl}/accept-invitation/${invitationId}`;

    // Prepare email parameters
    const emailParams = {
      organizationName,
      inviterName,
      recipientName: recipientName || email.split('@')[0],
      role: role.charAt(0).toUpperCase() + role.slice(1),
      acceptLink,
      expiryDate: EmailTemplateEngine.formatDate(expiryDate),
    };

    // Render the email template
    const renderedTemplate = EmailTemplateEngine.renderTemplate(
      EMAIL_TEMPLATES.teamInvitation,
      emailParams
    );

    // Queue the email
    const { error: queueError } = await supabase
      .from('email_queue')
      .insert({
        to_email: email,
        to_name: emailParams.recipientName,
        from_email: 'team@vibeqa.com',
        from_name: 'VibeQA Team',
        subject: renderedTemplate.subject,
        template: 'team_invitation',
        params: emailParams,
      });

    if (queueError) {
      console.error('Error queuing email:', queueError);
      // Don't fail the request if queuing fails, try to send directly
    }

    // Send the email immediately
    try {
      const result = await brevoClient.sendTransactionalEmail({
        to: [{ email, name: emailParams.recipientName }],
        sender: { email: 'team@vibeqa.com', name: 'VibeQA Team' },
        subject: renderedTemplate.subject,
        htmlContent: renderedTemplate.htmlContent,
        textContent: renderedTemplate.textContent,
        tags: ['invitation', organizationName],
      });

      // Mark as sent in the queue if it was queued
      if (!queueError) {
        await supabase
          .from('email_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('to_email', email)
          .eq('template', 'team_invitation')
          .is('sent_at', null);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: result.messageId,
          message: 'Invitation email sent successfully' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (sendError: any) {
      console.error('Error sending email:', sendError);
      
      // If direct sending fails, the queued email will be retried later
      if (!queueError) {
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed', 
            error: sendError.message,
            attempts: 1,
          })
          .eq('to_email', email)
          .eq('template', 'team_invitation')
          .is('sent_at', null);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email',
          details: sendError.message,
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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