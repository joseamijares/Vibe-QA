// Auth email templates with VibeQA branding
// Using the same color scheme as the landing page: #094765, #3387a7

export const AUTH_EMAIL_TEMPLATES = {
  // Welcome email for new users
  welcome: {
    subject: 'Welcome to VibeQA',
    htmlContent: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <!-- Header with gradient -->
  <div style="background: linear-gradient(135deg, #094765 0%, #3387a7 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">VibeQA</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">Welcome {{userName}}!</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
      Thanks for joining VibeQA. You're all set to start collecting better feedback.
    </p>
    
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="{{dashboardLink}}" style="display: inline-block; background: linear-gradient(135deg, #094765 0%, #3387a7 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 0; text-align: center;">
      Need help? Reply to this email anytime.
    </p>
  </div>
</div>
    `,
    textContent: `
Welcome {{userName}}!

Thanks for joining VibeQA. You're all set to start collecting better feedback.

Go to Dashboard: {{dashboardLink}}

Need help? Reply to this email anytime.

- The VibeQA Team
    `,
  },

  // Magic link login
  magicLink: {
    subject: 'Your VibeQA login link',
    htmlContent: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #094765 0%, #3387a7 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">VibeQA</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">Log in to VibeQA</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
      Click the button below to log in to your account. This link will expire in 1 hour.
    </p>
    
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="{{magicLink}}" style="display: inline-block; background: linear-gradient(135deg, #094765 0%, #3387a7 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Log In
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 0; text-align: center;">
      If you didn't request this email, you can safely ignore it.
    </p>
  </div>
</div>
    `,
    textContent: `
Log in to VibeQA

Click the link below to log in to your account. This link will expire in 1 hour.

{{magicLink}}

If you didn't request this email, you can safely ignore it.
    `,
  },

  // Password reset
  resetPassword: {
    subject: 'Reset your VibeQA password',
    htmlContent: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #094765 0%, #3387a7 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">VibeQA</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">Reset your password</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="{{resetLink}}" style="display: inline-block; background: linear-gradient(135deg, #094765 0%, #3387a7 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 0; text-align: center;">
      This link expires in 1 hour. If you didn't request this, please ignore this email.
    </p>
  </div>
</div>
    `,
    textContent: `
Reset your password

We received a request to reset your password. Click the link below to create a new password.

{{resetLink}}

This link expires in 1 hour. If you didn't request this, please ignore this email.
    `,
  },

  // Email verification
  verifyEmail: {
    subject: 'Verify your VibeQA email',
    htmlContent: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #094765 0%, #3387a7 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">VibeQA</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">Verify your email</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
      Please confirm your email address to complete your VibeQA account setup.
    </p>
    
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="{{verifyLink}}" style="display: inline-block; background: linear-gradient(135deg, #094765 0%, #3387a7 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Verify Email
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 0; text-align: center;">
      This link expires in 24 hours.
    </p>
  </div>
</div>
    `,
    textContent: `
Verify your email

Please confirm your email address to complete your VibeQA account setup.

{{verifyLink}}

This link expires in 24 hours.
    `,
  },

  // Email change confirmation
  confirmEmailChange: {
    subject: 'Confirm your new email address',
    htmlContent: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #094765 0%, #3387a7 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">VibeQA</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">Confirm email change</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      You requested to change your email to: <strong>{{newEmail}}</strong>
    </p>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
      Click below to confirm this change.
    </p>
    
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="{{confirmLink}}" style="display: inline-block; background: linear-gradient(135deg, #094765 0%, #3387a7 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Confirm New Email
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 0; text-align: center;">
      If you didn't request this change, please contact support immediately.
    </p>
  </div>
</div>
    `,
    textContent: `
Confirm email change

You requested to change your email to: {{newEmail}}

Click below to confirm this change.

{{confirmLink}}

If you didn't request this change, please contact support immediately.
    `,
  },
};

// Helper to get the appropriate template based on Supabase email type
export function getAuthEmailTemplate(emailType: string) {
  const templateMap: Record<string, keyof typeof AUTH_EMAIL_TEMPLATES> = {
    signup: 'welcome',
    invite: 'welcome',
    magiclink: 'magicLink',
    recovery: 'resetPassword',
    email_change: 'confirmEmailChange',
    confirmation: 'verifyEmail',
  };

  const templateKey = templateMap[emailType];
  return templateKey ? AUTH_EMAIL_TEMPLATES[templateKey] : null;
}