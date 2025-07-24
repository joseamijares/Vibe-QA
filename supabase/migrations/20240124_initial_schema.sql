-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  subscription_status VARCHAR(50) DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'team')),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255)
);

-- Create organization_members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  widget_settings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(organization_id, slug)
);

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'voice', 'screenshot', 'video')),
  content TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  page_url TEXT,
  media_url TEXT,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_api_key ON projects(api_key);
CREATE INDEX idx_feedback_project_id ON feedback(project_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage members" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their organizations" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for feedback
CREATE POLICY "Users can view feedback for their projects" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN organization_members ON organization_members.organization_id = projects.organization_id
      WHERE projects.id = feedback.project_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update feedback for their projects" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN organization_members ON organization_members.organization_id = projects.organization_id
      WHERE projects.id = feedback.project_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Public policy for widget to insert feedback (authenticated by API key)
CREATE POLICY "Widget can insert feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Function to create an organization after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_slug TEXT;
BEGIN
  -- Generate a unique slug
  org_slug := LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8);
  
  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (SPLIT_PART(NEW.email, '@', 1) || '''s Organization', org_slug)
  RETURNING id INTO org_id;
  
  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create organization on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('feedback-media', 'feedback-media', false),
  ('organization-assets', 'organization-assets', false);

-- Storage policies for feedback-media bucket
CREATE POLICY "Users can upload feedback media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'feedback-media' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view feedback media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'feedback-media' AND
    EXISTS (
      SELECT 1 FROM feedback f
      JOIN projects p ON p.id = f.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE f.media_url LIKE '%' || storage.objects.name
      AND om.user_id = auth.uid()
    )
  );

-- Storage policies for organization-assets bucket
CREATE POLICY "Organization members can manage assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'organization-assets' AND
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND storage.objects.name LIKE om.organization_id::text || '/%'
    )
  );