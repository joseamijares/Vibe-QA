import { supabase } from './supabase';

interface SendInvitationEmailParams {
  invitationId: string;
  email: string;
  organizationName: string;
  inviterName: string;
  recipientName?: string;
  role: string;
  expiryDate: string;
}

interface SendFeedbackNotificationParams {
  feedbackId: string;
  projectId: string;
  projectName: string;
  feedbackType: string;
  reporterName?: string;
  reporterEmail?: string;
  pageUrl?: string;
  description: string;
}

export class EmailService {
  private static async callEdgeFunction(functionName: string, payload: any) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw new Error(error.message || `Failed to call ${functionName}`);
    }

    return data;
  }

  /**
   * Send team invitation email
   */
  static async sendInvitationEmail(params: SendInvitationEmailParams) {
    try {
      const result = await this.callEdgeFunction('send-invitation-email', params);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Failed to send invitation email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send invitation email',
      };
    }
  }

  /**
   * Send feedback notification email
   */
  static async sendFeedbackNotification(params: SendFeedbackNotificationParams) {
    try {
      const result = await this.callEdgeFunction('send-feedback-notification', params);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Failed to send feedback notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send feedback notification',
      };
    }
  }

  /**
   * Queue an email for sending (useful for batch operations)
   */
  static async queueEmail(params: {
    toEmail: string;
    toName?: string;
    subject: string;
    template: string;
    templateParams: Record<string, any>;
  }) {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        to_email: params.toEmail,
        to_name: params.toName,
        subject: params.subject,
        template: params.template,
        params: params.templateParams,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to queue email:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get email queue status for debugging
   */
  static async getEmailQueueStatus(email: string) {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_email', email)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to get email queue status:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update email notification preferences
   */
  static async updateEmailPreferences(
    userId: string,
    preferences: {
      feedback?: boolean;
      invitations?: boolean;
      weekly_digest?: boolean;
    }
  ) {
    const { data, error } = await supabase
      .from('organization_members')
      .update({
        email_notifications: preferences,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update email preferences:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get email notification preferences
   */
  static async getEmailPreferences(userId: string) {
    const { data, error } = await supabase
      .from('organization_members')
      .select('email_notifications')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to get email preferences:', error);
      throw error;
    }

    return (
      data?.email_notifications || {
        feedback: true,
        invitations: true,
        weekly_digest: false,
      }
    );
  }
}
