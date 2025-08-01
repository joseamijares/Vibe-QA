interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

interface TemplateParams {
  [key: string]: string | number | boolean;
}

export class EmailTemplateEngine {
  /**
   * Replace template variables with actual values
   * Supports {{variable}} syntax with HTML escaping for security
   */
  static render(template: string, params: TemplateParams): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = params[key];
      if (value === undefined) return match;
      
      // HTML escape user-provided content for security
      return String(value).replace(/[&<>"']/g, (char) => {
        const escapeMap: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return escapeMap[char];
      });
    });
  }

  /**
   * Render a complete email template
   */
  static renderTemplate(template: EmailTemplate, params: TemplateParams): EmailTemplate {
    return {
      subject: this.render(template.subject, params),
      htmlContent: this.render(template.htmlContent, params),
      textContent: this.render(template.textContent, params),
    };
  }

  /**
   * Get color for feedback type
   */
  static getFeedbackTypeColor(type: string): string {
    const colors: Record<string, string> = {
      bug: '#DC2626',
      suggestion: '#2563EB',
      praise: '#16A34A',
      other: '#6B7280',
    };
    return colors[type.toLowerCase()] || colors.other;
  }

  /**
   * Format date for email display
   */
  static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Generate unsubscribe link
   */
  static generateUnsubscribeLink(baseUrl: string, userId: string, type: string): string {
    const params = new URLSearchParams({
      user: userId,
      type: type,
      token: this.generateToken(userId, type),
    });
    return `${baseUrl}/unsubscribe?${params.toString()}`;
  }

  /**
   * Generate a simple token for unsubscribe links
   * In production, use a proper signing method
   */
  private static generateToken(userId: string, type: string): string {
    // This is a simplified version. In production, use proper JWT or signed tokens
    return btoa(`${userId}:${type}:${Date.now()}`);
  }
}

// Pre-defined email templates
export const EMAIL_TEMPLATES = {
  teamInvitation: {
    subject: "You've been invited to join {{organizationName}} on VibeQA",
    htmlContent: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #094765 0%, #3387a7 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600;">VibeQA</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Better Feedback, Better Products</p>
  </div>
  
  <div style="padding: 40px 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">You're invited to join {{organizationName}}!</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
      Hi {{recipientName}},
    </p>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
      <strong>{{inviterName}}</strong> has invited you to join <strong>{{organizationName}}</strong> on VibeQA as a <strong>{{role}}</strong>.
    </p>
    
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
      <p style="color: #4b5563; font-size: 14px; margin: 0;">
        VibeQA helps teams collect and manage QA feedback efficiently with powerful tools for bug tracking, feature suggestions, and user insights.
      </p>
    </div>
    
    <div style="text-align: center; margin: 0 0 30px 0;">
      <a href="{{acceptLink}}" style="display: inline-block; background: linear-gradient(135deg, #094765 0%, #3387a7 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 0; text-align: center;">
      This invitation will expire on <strong>{{expiryDate}}</strong>
    </p>
  </div>
  
  <div style="padding: 30px; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © 2024 VibeQA. All rights reserved.
    </p>
  </div>
</div>
    `,
    textContent: `
Hi {{recipientName}},

{{inviterName}} has invited you to join {{organizationName}} on VibeQA as a {{role}}.

VibeQA helps teams collect and manage QA feedback efficiently with powerful tools for bug tracking, feature suggestions, and user insights.

Accept the invitation: {{acceptLink}}

This invitation will expire on {{expiryDate}}.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The VibeQA Team

© 2024 VibeQA. All rights reserved.
    `,
  },

  feedbackNotification: {
    subject: 'New {{feedbackType}} feedback for {{projectName}}',
    htmlContent: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #094765 0%, #3387a7 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">VibeQA</h1>
  </div>
  
  <div style="padding: 40px 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">
      New <span style="color: {{typeColor}};">{{feedbackType}}</span> feedback received
    </h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
      A new feedback has been submitted for <strong>{{projectName}}</strong>.
    </p>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 0 0 30px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 0 0 12px 0; vertical-align: top; width: 100px;">
            <strong style="color: #6b7280; font-size: 14px;">Type:</strong>
          </td>
          <td style="padding: 0 0 12px 0;">
            <span style="display: inline-block; background-color: {{typeColor}}20; color: {{typeColor}}; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
              {{feedbackType}}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px 0; vertical-align: top;">
            <strong style="color: #6b7280; font-size: 14px;">From:</strong>
          </td>
          <td style="padding: 0 0 12px 0; color: #111827; font-size: 14px;">
            {{reporterName}} ({{reporterEmail}})
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px 0; vertical-align: top;">
            <strong style="color: #6b7280; font-size: 14px;">Page:</strong>
          </td>
          <td style="padding: 0 0 12px 0;">
            <a href="{{pageUrl}}" style="color: #3387a7; font-size: 14px; text-decoration: none;">
              {{pageUrl}}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 0; vertical-align: top;">
            <strong style="color: #6b7280; font-size: 14px;">Description:</strong>
          </td>
          <td style="padding: 0; color: #374151; font-size: 14px; line-height: 20px;">
            {{description}}
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 0 0 30px 0;">
      <a href="{{feedbackLink}}" style="display: inline-block; background: linear-gradient(135deg, #094765 0%, #3387a7 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Full Feedback
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      You received this email because you have feedback notifications enabled for {{projectName}}.<br>
      <a href="{{unsubscribeLink}}" style="color: #6b7280; text-decoration: underline;">
        Manage notification preferences
      </a>
    </p>
  </div>
</div>
    `,
    textContent: `
New {{feedbackType}} feedback received for {{projectName}}

From: {{reporterName}} ({{reporterEmail}})
Page: {{pageUrl}}

Description:
{{description}}

View full feedback: {{feedbackLink}}

---
You received this email because you have feedback notifications enabled for {{projectName}}.
Manage notification preferences: {{unsubscribeLink}}
    `,
  },
};