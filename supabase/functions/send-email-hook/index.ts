import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { BrevoClient } from '../_shared/brevo-client.ts';
import { getAuthEmailTemplate } from '../_shared/auth-email-templates.ts';
import { EmailTemplateEngine } from '../_shared/email-templates.ts';

// Initialize Brevo client
const brevoClient = new BrevoClient(Deno.env.get('BREVO_API_KEY') || '');

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_EMAILS_PER_WINDOW = 10; // Max 10 emails per minute per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Check rate limit
function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(email);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(email, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= MAX_EMAILS_PER_WINDOW) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(email);
    }
  }
}, RATE_LIMIT_WINDOW);

// Validate redirect URLs for security
function validateRedirectUrl(url: string | undefined, baseUrl: string): string | undefined {
  if (!url) return undefined;
  
  try {
    const parsedUrl = new URL(url);
    const parsedBase = new URL(baseUrl);
    
    // Allow same domain or configured allowed domains
    const allowedDomains = [
      parsedBase.hostname,
      'vibeqa.com',
      'app.vibeqa.com',
      'localhost', // for development
    ];
    
    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    return isAllowed ? url : undefined;
  } catch {
    return undefined;
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  let payload: any;
  
  try {
    // Verify the webhook secret
    const authHeader = req.headers.get('Authorization');
    const webhookSecret = Deno.env.get('SUPABASE_AUTH_HOOK_SECRET');
    
    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      console.error('Unauthorized webhook request:', { requestId });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    payload = await req.json();
    const { user, email_data } = payload;

    // Extract email details
    const email = user.email;
    const emailType = email_data.email_action_type;
    
    console.log('Processing auth email:', {
      requestId,
      emailType,
      userEmail: email,
      timestamp: new Date().toISOString(),
    });
    
    // Check rate limit
    if (!checkRateLimit(email)) {
      console.error(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the appropriate template
    const template = getAuthEmailTemplate(emailType);
    if (!template) {
      console.error(`No template found for email type: ${emailType}`);
      return new Response(
        JSON.stringify({ error: 'Unknown email type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare template variables
    const baseUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://app.vibeqa.com';
    const templateVars: Record<string, string> = {
      userName: user.user_metadata?.full_name || email.split('@')[0],
      email: email,
      dashboardLink: `${baseUrl}/dashboard`,
    };

    // Add specific variables based on email type with URL validation
    switch (emailType) {
      case 'signup':
      case 'invite':
        // Welcome email - dashboard link already set
        break;
      case 'magiclink':
        templateVars.magicLink = validateRedirectUrl(email_data.redirect_to, baseUrl) || 
                                validateRedirectUrl(email_data.token_url, baseUrl) || 
                                `${baseUrl}/auth/confirm?token=${email_data.token_hash}`;
        break;
      case 'recovery':
        templateVars.resetLink = validateRedirectUrl(email_data.redirect_to, baseUrl) || 
                                validateRedirectUrl(email_data.token_url, baseUrl) || 
                                `${baseUrl}/auth/reset-password?token=${email_data.token_hash}`;
        break;
      case 'email_change':
        templateVars.newEmail = email_data.new_email || email;
        templateVars.confirmLink = validateRedirectUrl(email_data.redirect_to, baseUrl) || 
                                  validateRedirectUrl(email_data.token_url, baseUrl) || 
                                  `${baseUrl}/auth/confirm?token=${email_data.token_hash}`;
        break;
      case 'confirmation':
        templateVars.verifyLink = validateRedirectUrl(email_data.redirect_to, baseUrl) || 
                                 validateRedirectUrl(email_data.token_url, baseUrl) || 
                                 `${baseUrl}/auth/confirm?token=${email_data.token_hash}`;
        break;
    }

    // Render the template
    const renderedTemplate = EmailTemplateEngine.renderTemplate(template, templateVars);

    // Send email via Brevo
    await brevoClient.sendTransactionalEmail({
      to: [{ email: email, name: templateVars.userName }],
      sender: {
        email: Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@vibeqa.com',
        name: 'VibeQA',
      },
      subject: renderedTemplate.subject,
      htmlContent: renderedTemplate.htmlContent,
      textContent: renderedTemplate.textContent,
      tags: [`auth-${emailType}`, 'transactional'],
    });

    const duration = Date.now() - startTime;
    console.log('Successfully sent auth email:', {
      requestId,
      emailType,
      userEmail: email,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, requestId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Error in send-email-hook:', {
      requestId,
      error: error.message,
      emailType: payload?.email_data?.email_action_type,
      userEmail: payload?.user?.email,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ error: error.message, requestId }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});