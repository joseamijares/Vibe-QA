-- Update feedback table to match widget requirements

-- Add organization_id column
ALTER TABLE feedback 
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update organization_id from projects
UPDATE feedback f
SET organization_id = p.organization_id
FROM projects p
WHERE f.project_id = p.id;

-- Make organization_id NOT NULL after populating
ALTER TABLE feedback 
ALTER COLUMN organization_id SET NOT NULL;

-- Rename and update columns
ALTER TABLE feedback 
  ALTER COLUMN type TYPE VARCHAR(50),
  DROP CONSTRAINT feedback_type_check;

ALTER TABLE feedback
  ADD CONSTRAINT feedback_type_check CHECK (type IN ('bug', 'suggestion', 'praise', 'other'));

-- Rename columns to match API
ALTER TABLE feedback 
  RENAME COLUMN content TO description;

ALTER TABLE feedback 
  RENAME COLUMN user_email TO reporter_email;

ALTER TABLE feedback 
  RENAME COLUMN user_name TO reporter_name;

-- Add new columns
ALTER TABLE feedback 
  ADD COLUMN title VARCHAR(255),
  ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN browser_info JSONB,
  ADD COLUMN device_info JSONB,
  ADD COLUMN custom_data JSONB,
  ADD COLUMN screenshots TEXT[],
  ADD COLUMN recordings TEXT[];

-- Drop media_url as we're using arrays
ALTER TABLE feedback 
  DROP COLUMN media_url;

-- Create index on organization_id
CREATE INDEX idx_feedback_organization_id ON feedback(organization_id);

-- Update RLS policies for feedback
DROP POLICY IF EXISTS "Feedback viewable by project organization members" ON feedback;
DROP POLICY IF EXISTS "Feedback creatable by anyone with project key" ON feedback;

-- Allow organization members to view feedback
CREATE POLICY "Organization members can view feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow organization members to update feedback
CREATE POLICY "Organization members can update feedback"
  ON feedback FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow anyone to insert feedback (validated by API key in the API)
CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE feedback IS 'Stores all feedback submissions from the widget';