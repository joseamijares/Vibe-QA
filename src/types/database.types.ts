export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          api_key: string;
          settings: Json;
          allowed_domains: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          api_key?: string;
          settings?: Json;
          allowed_domains?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          api_key?: string;
          settings?: Json;
          allowed_domains?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['user_role'];
          joined_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: Database['public']['Enums']['user_role'];
          joined_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['user_role'];
          joined_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          project_id: string;
          type: Database['public']['Enums']['feedback_type'];
          status: Database['public']['Enums']['feedback_status'];
          priority: Database['public']['Enums']['feedback_priority'];
          title: string | null;
          description: string;
          reporter_email: string | null;
          reporter_name: string | null;
          page_url: string | null;
          user_agent: string | null;
          browser_info: Json | null;
          device_info: Json | null;
          custom_data: Json | null;
          metadata: Json;
          assigned_to: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type?: Database['public']['Enums']['feedback_type'];
          status?: Database['public']['Enums']['feedback_status'];
          priority?: Database['public']['Enums']['feedback_priority'];
          title?: string | null;
          description: string;
          reporter_email?: string | null;
          reporter_name?: string | null;
          page_url?: string | null;
          user_agent?: string | null;
          browser_info?: Json | null;
          device_info?: Json | null;
          custom_data?: Json | null;
          metadata?: Json;
          assigned_to?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          type?: Database['public']['Enums']['feedback_type'];
          status?: Database['public']['Enums']['feedback_status'];
          priority?: Database['public']['Enums']['feedback_priority'];
          title?: string | null;
          description?: string;
          reporter_email?: string | null;
          reporter_name?: string | null;
          page_url?: string | null;
          user_agent?: string | null;
          browser_info?: Json | null;
          device_info?: Json | null;
          custom_data?: Json | null;
          metadata?: Json;
          assigned_to?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback_media: {
        Row: {
          id: string;
          feedback_id: string;
          type: 'screenshot' | 'video' | 'audio';
          url: string;
          thumbnail_url: string | null;
          file_size: number | null;
          duration: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          feedback_id: string;
          type: 'screenshot' | 'video' | 'audio';
          url: string;
          thumbnail_url?: string | null;
          file_size?: number | null;
          duration?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          feedback_id?: string;
          type?: 'screenshot' | 'video' | 'audio';
          url?: string;
          thumbnail_url?: string | null;
          file_size?: number | null;
          duration?: number | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          feedback_id: string;
          user_id: string;
          content: string;
          is_internal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          feedback_id: string;
          user_id: string;
          content: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          feedback_id?: string;
          user_id?: string;
          content?: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: Database['public']['Enums']['user_role'];
          invited_by: string | null;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: Database['public']['Enums']['user_role'];
          invited_by?: string | null;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: Database['public']['Enums']['user_role'];
          invited_by?: string | null;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_organization_for_user: {
        Args: {
          user_id: string;
          org_name: string;
          org_slug: string;
        };
        Returns: string;
      };
      is_organization_member: {
        Args: {
          org_id: string;
          user_id: string;
        };
        Returns: boolean;
      };
      get_user_role: {
        Args: {
          org_id: string;
          user_id: string;
        };
        Returns: Database['public']['Enums']['user_role'];
      };
      get_user_organizations: {
        Args: {
          user_id: string;
        };
        Returns: string[];
      };
      cleanup_old_feedback_media: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_media_url: {
        Args: {
          bucket: string;
          path: string;
          expires_in?: number;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: 'owner' | 'admin' | 'member' | 'viewer';
      feedback_type: 'bug' | 'suggestion' | 'praise' | 'other';
      feedback_status: 'new' | 'in_progress' | 'resolved' | 'archived';
      feedback_priority: 'low' | 'medium' | 'high' | 'critical';
    };
  };
};

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Convenience types
export type Organization = Tables<'organizations'>;
export type Project = Tables<'projects'>;
export type OrganizationMember = Tables<'organization_members'>;
export type Feedback = Tables<'feedback'>;
export type FeedbackMedia = Tables<'feedback_media'>;
export type Comment = Tables<'comments'>;
export type ActivityLog = Tables<'activity_logs'>;
export type Invitation = Tables<'invitations'>;

export type UserRole = Enums<'user_role'>;
export type FeedbackType = Enums<'feedback_type'>;
export type FeedbackStatus = Enums<'feedback_status'>;
export type FeedbackPriority = Enums<'feedback_priority'>;

// Extended types with relations
export interface OrganizationWithMembers extends Organization {
  members?: OrganizationMember[];
}

export interface ProjectWithOrganization extends Project {
  organization?: Organization;
}

export interface FeedbackWithDetails extends Feedback {
  project?: Project;
  media?: FeedbackMedia[];
  comments?: Comment[];
  assigned_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface CommentWithUser extends Comment {
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}
