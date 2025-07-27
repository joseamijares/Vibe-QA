-- Add email notification preferences to organization_members
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS email_notifications jsonb DEFAULT '{"feedback": true, "invitations": true, "weekly_digest": false}'::jsonb;

-- Create email queue table for reliable email delivery
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_name text,
  from_email text DEFAULT 'noreply@vibeqa.com',
  from_name text DEFAULT 'VibeQA',
  subject text NOT NULL,
  template text NOT NULL,
  params jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  sent_at timestamptz,
  
  -- Indexes for efficient querying
  INDEX idx_email_queue_status (status),
  INDEX idx_email_queue_created_at (created_at)
);

-- Create email templates table for managing templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_template text NOT NULL,
  text_template text,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_template, text_template, variables) VALUES
(
  'team_invitation',
  'You''ve been invited to join {{organizationName}} on VibeQA',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #094765; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">VibeQA</h1>
    </div>
    <div style="padding: 30px; background-color: #f5f5f5;">
      <h2 style="color: #333;">You''re invited to join {{organizationName}}!</h2>
      <p style="color: #666; font-size: 16px;">Hi {{recipientName}},</p>
      <p style="color: #666; font-size: 16px;">{{inviterName}} has invited you to join <strong>{{organizationName}}</strong> on VibeQA as a <strong>{{role}}</strong>.</p>
      <p style="color: #666; font-size: 16px;">VibeQA helps teams collect and manage QA feedback efficiently. Click the button below to accept the invitation and get started.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{acceptLink}}" style="background-color: #094765; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
      </div>
      <p style="color: #999; font-size: 14px;">This invitation will expire on {{expiryDate}}. If you didn''t expect this invitation, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2024 VibeQA. All rights reserved.</p>
    </div>
  </div>',
  'Hi {{recipientName}},

{{inviterName}} has invited you to join {{organizationName}} on VibeQA as a {{role}}.

Accept the invitation: {{acceptLink}}

This invitation will expire on {{expiryDate}}.

Best regards,
The VibeQA Team',
  '["organizationName", "recipientName", "inviterName", "role", "acceptLink", "expiryDate"]'::jsonb
),
(
  'feedback_notification',
  'New feedback received for {{projectName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #094765; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">VibeQA</h1>
    </div>
    <div style="padding: 30px; background-color: #f5f5f5;">
      <h2 style="color: #333;">New {{feedbackType}} feedback received</h2>
      <p style="color: #666; font-size: 16px;">A new feedback has been submitted for <strong>{{projectName}}</strong>.</p>
      
      <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Type:</strong> <span style="color: {{typeColor}};">{{feedbackType}}</span></p>
        <p style="margin: 0 0 10px 0;"><strong>From:</strong> {{reporterName}} ({{reporterEmail}})</p>
        <p style="margin: 0 0 10px 0;"><strong>Page:</strong> {{pageUrl}}</p>
        <p style="margin: 0;"><strong>Description:</strong></p>
        <p style="color: #666; margin: 10px 0;">{{description}}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{feedbackLink}}" style="background-color: #094765; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Feedback</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        You received this email because you have feedback notifications enabled for {{projectName}}.<br>
        <a href="{{unsubscribeLink}}" style="color: #666;">Manage notification preferences</a>
      </p>
    </div>
  </div>',
  'New {{feedbackType}} feedback received for {{projectName}}

From: {{reporterName}} ({{reporterEmail}})
Page: {{pageUrl}}

Description:
{{description}}

View feedback: {{feedbackLink}}

---
Manage notification preferences: {{unsubscribeLink}}',
  '["projectName", "feedbackType", "typeColor", "reporterName", "reporterEmail", "pageUrl", "description", "feedbackLink", "unsubscribeLink"]'::jsonb
);

-- Function to clean up old processed emails
CREATE OR REPLACE FUNCTION cleanup_old_emails()
RETURNS void AS $$
BEGIN
  -- Delete successfully sent emails older than 30 days
  DELETE FROM email_queue
  WHERE status = 'sent'
  AND sent_at < NOW() - INTERVAL '30 days';
  
  -- Delete failed emails older than 7 days
  DELETE FROM email_queue
  WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to process email queue (to be called by Edge Function)
CREATE OR REPLACE FUNCTION get_pending_emails(batch_size int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  to_email text,
  to_name text,
  from_email text,
  from_name text,
  subject text,
  template text,
  params jsonb,
  attempts int
) AS $$
BEGIN
  RETURN QUERY
  UPDATE email_queue eq
  SET 
    status = 'processing',
    processed_at = NOW(),
    attempts = attempts + 1
  FROM (
    SELECT e.id
    FROM email_queue e
    WHERE e.status IN ('pending', 'failed')
    AND e.attempts < e.max_attempts
    AND (e.processed_at IS NULL OR e.processed_at < NOW() - INTERVAL '5 minutes')
    ORDER BY e.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  ) AS pending
  WHERE eq.id = pending.id
  RETURNING 
    eq.id,
    eq.to_email,
    eq.to_name,
    eq.from_email,
    eq.from_name,
    eq.subject,
    eq.template,
    eq.params,
    eq.attempts;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(email_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE email_queue
  SET 
    status = 'sent',
    sent_at = NOW()
  WHERE id = email_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION mark_email_failed(email_id uuid, error_message text)
RETURNS void AS $$
BEGIN
  UPDATE email_queue
  SET 
    status = CASE 
      WHEN attempts >= max_attempts THEN 'failed'
      ELSE 'pending'
    END,
    error = error_message
  WHERE id = email_id;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for email tables
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Only system can access email queue
CREATE POLICY "System can manage email queue"
  ON email_queue
  FOR ALL
  USING (false);

-- Email templates are read-only for authenticated users
CREATE POLICY "Users can view email templates"
  ON email_templates
  FOR SELECT
  USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user emails (for Edge Functions)
CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;