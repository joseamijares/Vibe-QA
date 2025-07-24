export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
          subscription_status: 'free' | 'pro' | 'team';
          subscription_end_date: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
          subscription_status?: 'free' | 'pro' | 'team';
          subscription_end_date?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
          subscription_status?: 'free' | 'pro' | 'team';
          subscription_end_date?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
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
          api_key: string;
          widget_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          api_key?: string;
          widget_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          api_key?: string;
          widget_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          project_id: string;
          type: 'text' | 'voice' | 'screenshot' | 'video';
          content: string | null;
          metadata: Json;
          user_email: string | null;
          user_name: string | null;
          page_url: string | null;
          media_url: string | null;
          status: 'new' | 'in_progress' | 'resolved' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: 'text' | 'voice' | 'screenshot' | 'video';
          content?: string | null;
          metadata?: Json;
          user_email?: string | null;
          user_name?: string | null;
          page_url?: string | null;
          media_url?: string | null;
          status?: 'new' | 'in_progress' | 'resolved' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          type?: 'text' | 'voice' | 'screenshot' | 'video';
          content?: string | null;
          metadata?: Json;
          user_email?: string | null;
          user_name?: string | null;
          page_url?: string | null;
          media_url?: string | null;
          status?: 'new' | 'in_progress' | 'resolved' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
