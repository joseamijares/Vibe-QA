export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)';
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string | null;
          resource_id: string | null;
          resource_type: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string | null;
          resource_id?: string | null;
          resource_type: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string | null;
          resource_id?: string | null;
          resource_type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      comments: {
        Row: {
          content: string;
          created_at: string | null;
          feedback_id: string | null;
          id: string;
          is_internal: boolean | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          feedback_id?: string | null;
          id?: string;
          is_internal?: boolean | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          feedback_id?: string | null;
          id?: string;
          is_internal?: boolean | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_feedback_id_fkey';
            columns: ['feedback_id'];
            isOneToOne: false;
            referencedRelation: 'feedback';
            referencedColumns: ['id'];
          },
        ];
      };
      coupon_usage: {
        Row: {
          applied_at: string | null;
          coupon_id: string | null;
          created_by: string | null;
          discount_amount: number;
          id: string;
          organization_id: string | null;
          stripe_discount_id: string | null;
          subscription_id: string | null;
        };
        Insert: {
          applied_at?: string | null;
          coupon_id?: string | null;
          created_by?: string | null;
          discount_amount: number;
          id?: string;
          organization_id?: string | null;
          stripe_discount_id?: string | null;
          subscription_id?: string | null;
        };
        Update: {
          applied_at?: string | null;
          coupon_id?: string | null;
          created_by?: string | null;
          discount_amount?: number;
          id?: string;
          organization_id?: string | null;
          stripe_discount_id?: string | null;
          subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'coupon_usage_coupon_id_fkey';
            columns: ['coupon_id'];
            isOneToOne: false;
            referencedRelation: 'coupons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_usage_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_usage_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'organization_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      coupons: {
        Row: {
          applicable_plans: string[] | null;
          code: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          status: Database['public']['Enums']['coupon_status'] | null;
          type: Database['public']['Enums']['coupon_type'];
          updated_at: string | null;
          usage_limit: number | null;
          used_count: number | null;
          valid_from: string | null;
          valid_until: string | null;
          value: number;
        };
        Insert: {
          applicable_plans?: string[] | null;
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          status?: Database['public']['Enums']['coupon_status'] | null;
          type: Database['public']['Enums']['coupon_type'];
          updated_at?: string | null;
          usage_limit?: number | null;
          used_count?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          value: number;
        };
        Update: {
          applicable_plans?: string[] | null;
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          status?: Database['public']['Enums']['coupon_status'] | null;
          type?: Database['public']['Enums']['coupon_type'];
          updated_at?: string | null;
          usage_limit?: number | null;
          used_count?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          value?: number;
        };
        Relationships: [];
      };
      email_queue: {
        Row: {
          attempts: number | null;
          created_at: string | null;
          error: string | null;
          from_email: string;
          from_name: string | null;
          id: string;
          params: Json | null;
          scheduled_at: string | null;
          sent_at: string | null;
          status: string | null;
          subject: string;
          template: string | null;
          to_email: string;
          to_name: string | null;
        };
        Insert: {
          attempts?: number | null;
          created_at?: string | null;
          error?: string | null;
          from_email?: string;
          from_name?: string | null;
          id?: string;
          params?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          subject: string;
          template?: string | null;
          to_email: string;
          to_name?: string | null;
        };
        Update: {
          attempts?: number | null;
          created_at?: string | null;
          error?: string | null;
          from_email?: string;
          from_name?: string | null;
          id?: string;
          params?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          subject?: string;
          template?: string | null;
          to_email?: string;
          to_name?: string | null;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          created_at: string | null;
          html_content: string;
          id: string;
          name: string;
          subject: string;
          text_content: string | null;
          updated_at: string | null;
          variables: Json | null;
        };
        Insert: {
          created_at?: string | null;
          html_content: string;
          id?: string;
          name: string;
          subject: string;
          text_content?: string | null;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Update: {
          created_at?: string | null;
          html_content?: string;
          id?: string;
          name?: string;
          subject?: string;
          text_content?: string | null;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          assigned_to: string | null;
          browser_info: Json | null;
          created_at: string | null;
          custom_data: Json | null;
          description: string;
          device_info: Json | null;
          id: string;
          metadata: Json | null;
          page_url: string | null;
          priority: Database['public']['Enums']['feedback_priority'];
          project_id: string | null;
          reporter_email: string | null;
          reporter_name: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database['public']['Enums']['feedback_status'];
          title: string | null;
          type: Database['public']['Enums']['feedback_type'];
          updated_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          browser_info?: Json | null;
          created_at?: string | null;
          custom_data?: Json | null;
          description: string;
          device_info?: Json | null;
          id?: string;
          metadata?: Json | null;
          page_url?: string | null;
          priority?: Database['public']['Enums']['feedback_priority'];
          project_id?: string | null;
          reporter_email?: string | null;
          reporter_name?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['feedback_status'];
          title?: string | null;
          type?: Database['public']['Enums']['feedback_type'];
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          browser_info?: Json | null;
          created_at?: string | null;
          custom_data?: Json | null;
          description?: string;
          device_info?: Json | null;
          id?: string;
          metadata?: Json | null;
          page_url?: string | null;
          priority?: Database['public']['Enums']['feedback_priority'];
          project_id?: string | null;
          reporter_email?: string | null;
          reporter_name?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['feedback_status'];
          title?: string | null;
          type?: Database['public']['Enums']['feedback_type'];
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      feedback_media: {
        Row: {
          created_at: string | null;
          duration: number | null;
          feedback_id: string | null;
          file_size: number | null;
          id: string;
          metadata: Json | null;
          thumbnail_url: string | null;
          type: string;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          duration?: number | null;
          feedback_id?: string | null;
          file_size?: number | null;
          id?: string;
          metadata?: Json | null;
          thumbnail_url?: string | null;
          type: string;
          url: string;
        };
        Update: {
          created_at?: string | null;
          duration?: number | null;
          feedback_id?: string | null;
          file_size?: number | null;
          id?: string;
          metadata?: Json | null;
          thumbnail_url?: string | null;
          type?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_media_feedback_id_fkey';
            columns: ['feedback_id'];
            isOneToOne: false;
            referencedRelation: 'feedback';
            referencedColumns: ['id'];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          email: string;
          expires_at: string | null;
          id: string;
          invited_by: string | null;
          organization_id: string | null;
          role: Database['public']['Enums']['user_role'];
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          email: string;
          expires_at?: string | null;
          id?: string;
          invited_by?: string | null;
          organization_id?: string | null;
          role?: Database['public']['Enums']['user_role'];
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          email?: string;
          expires_at?: string | null;
          id?: string;
          invited_by?: string | null;
          organization_id?: string | null;
          role?: Database['public']['Enums']['user_role'];
        };
        Relationships: [
          {
            foreignKeyName: 'invitations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          amount_due: number | null;
          amount_paid: number | null;
          created_at: string | null;
          currency: string | null;
          hosted_invoice_url: string | null;
          id: string;
          invoice_pdf: string | null;
          organization_id: string;
          period_end: string | null;
          period_start: string | null;
          status: string;
          stripe_invoice_id: string;
        };
        Insert: {
          amount_due?: number | null;
          amount_paid?: number | null;
          created_at?: string | null;
          currency?: string | null;
          hosted_invoice_url?: string | null;
          id?: string;
          invoice_pdf?: string | null;
          organization_id: string;
          period_end?: string | null;
          period_start?: string | null;
          status: string;
          stripe_invoice_id: string;
        };
        Update: {
          amount_due?: number | null;
          amount_paid?: number | null;
          created_at?: string | null;
          currency?: string | null;
          hosted_invoice_url?: string | null;
          id?: string;
          invoice_pdf?: string | null;
          organization_id?: string;
          period_end?: string | null;
          period_start?: string | null;
          status?: string;
          stripe_invoice_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_members: {
        Row: {
          id: string;
          joined_at: string | null;
          organization_id: string | null;
          role: Database['public']['Enums']['user_role'];
          user_id: string | null;
        };
        Insert: {
          id?: string;
          joined_at?: string | null;
          organization_id?: string | null;
          role?: Database['public']['Enums']['user_role'];
          user_id?: string | null;
        };
        Update: {
          id?: string;
          joined_at?: string | null;
          organization_id?: string | null;
          role?: Database['public']['Enums']['user_role'];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_subscriptions: {
        Row: {
          cancel_at: string | null;
          canceled_at: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
          plan_id: string | null;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_end: string | null;
          updated_at: string | null;
        };
        Insert: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          plan_id?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          plan_id?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_subscriptions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: true;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_usage: {
        Row: {
          api_calls: number | null;
          created_at: string | null;
          feedback_count: number | null;
          id: string;
          month: string;
          organization_id: string;
          storage_bytes: number | null;
          updated_at: string | null;
        };
        Insert: {
          api_calls?: number | null;
          created_at?: string | null;
          feedback_count?: number | null;
          id?: string;
          month: string;
          organization_id: string;
          storage_bytes?: number | null;
          updated_at?: string | null;
        };
        Update: {
          api_calls?: number | null;
          created_at?: string | null;
          feedback_count?: number | null;
          id?: string;
          month?: string;
          organization_id?: string;
          storage_bytes?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_usage_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          settings: Json | null;
          slug: string;
          subscription_plan_id: string | null;
          subscription_status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          settings?: Json | null;
          slug: string;
          subscription_plan_id?: string | null;
          subscription_status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          settings?: Json | null;
          slug?: string;
          subscription_plan_id?: string | null;
          subscription_status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'organizations_subscription_plan_id_fkey';
            columns: ['subscription_plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_methods: {
        Row: {
          brand: string | null;
          created_at: string | null;
          exp_month: number | null;
          exp_year: number | null;
          id: string;
          is_default: boolean | null;
          last4: string | null;
          organization_id: string;
          stripe_payment_method_id: string;
          type: string;
        };
        Insert: {
          brand?: string | null;
          created_at?: string | null;
          exp_month?: number | null;
          exp_year?: number | null;
          id?: string;
          is_default?: boolean | null;
          last4?: string | null;
          organization_id: string;
          stripe_payment_method_id: string;
          type: string;
        };
        Update: {
          brand?: string | null;
          created_at?: string | null;
          exp_month?: number | null;
          exp_year?: number | null;
          id?: string;
          is_default?: boolean | null;
          last4?: string | null;
          organization_id?: string;
          stripe_payment_method_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_methods_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          notification_preferences: Json | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          notification_preferences?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          notification_preferences?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          allowed_domains: string[] | null;
          api_key: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string | null;
          settings: Json | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          allowed_domains?: string[] | null;
          api_key: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id?: string | null;
          settings?: Json | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          allowed_domains?: string[] | null;
          api_key?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string | null;
          settings?: Json | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      revenue_reports: {
        Row: {
          generated_at: string | null;
          id: string;
          metrics: Json;
          report_date: string;
        };
        Insert: {
          generated_at?: string | null;
          id?: string;
          metrics: Json;
          report_date: string;
        };
        Update: {
          generated_at?: string | null;
          id?: string;
          metrics?: Json;
          report_date?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          created_at: string | null;
          description: string | null;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          limits: Json | null;
          name: string;
          price_monthly: number | null;
          price_yearly: number | null;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id: string;
          is_active?: boolean | null;
          limits?: Json | null;
          name: string;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          limits?: Json | null;
          name?: string;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      superadmin_audit_log: {
        Row: {
          action: string;
          admin_user_id: string | null;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: unknown | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          admin_user_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: unknown | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          admin_user_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: unknown | null;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      system_metrics: {
        Row: {
          id: string;
          metric_name: string;
          metric_type: string;
          metric_value: Json;
          period_end: string | null;
          period_start: string | null;
          recorded_at: string | null;
        };
        Insert: {
          id?: string;
          metric_name: string;
          metric_type: string;
          metric_value: Json;
          period_end?: string | null;
          period_start?: string | null;
          recorded_at?: string | null;
        };
        Update: {
          id?: string;
          metric_name?: string;
          metric_type?: string;
          metric_value?: Json;
          period_end?: string | null;
          period_start?: string | null;
          recorded_at?: string | null;
        };
        Relationships: [];
      };
      widget_versions: {
        Row: {
          channel: string;
          checksum: string | null;
          created_at: string | null;
          created_by: string | null;
          file_path: string;
          file_size: number | null;
          id: string;
          is_latest: boolean | null;
          release_notes: string | null;
          version: string;
        };
        Insert: {
          channel?: string;
          checksum?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          file_path: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          release_notes?: string | null;
          version: string;
        };
        Update: {
          channel?: string;
          checksum?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          file_path?: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          release_notes?: string | null;
          version?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_coupon: {
        Args: {
          p_coupon_id: string;
          p_organization_id: string;
          p_subscription_id: string;
          p_discount_amount: number;
          p_stripe_discount_id?: string;
        };
        Returns: string;
      };
      calculate_revenue_metrics: {
        Args: { p_date?: string };
        Returns: Json;
      };
      create_organization_for_user: {
        Args: { user_id: string; org_name: string; org_slug: string };
        Returns: string;
      };
      create_user_as_superadmin: {
        Args: { user_email: string; user_password: string };
        Returns: string;
      };
      delete_user_as_superadmin: {
        Args: { user_id: string };
        Returns: undefined;
      };
      ensure_all_users_have_organizations: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_all_users_with_organizations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          email: string;
          created_at: string;
          organizations: Json;
        }[];
      };
      increment_feedback_count: {
        Args: { org_id: string };
        Returns: undefined;
      };
      is_superadmin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      record_system_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      validate_coupon: {
        Args: { coupon_code: string };
        Returns: {
          is_valid: boolean;
          coupon_id: string;
          discount_type: Database['public']['Enums']['coupon_type'];
          discount_value: number;
          message: string;
        }[];
      };
    };
    Enums: {
      coupon_status: 'active' | 'expired' | 'depleted';
      coupon_type: 'percentage' | 'fixed_amount';
      feedback_priority: 'low' | 'medium' | 'high' | 'critical';
      feedback_status: 'new' | 'in_progress' | 'resolved' | 'archived';
      feedback_type: 'bug' | 'suggestion' | 'praise' | 'other';
      user_role: 'owner' | 'superadmin' | 'admin' | 'member' | 'viewer';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      coupon_status: ['active', 'expired', 'depleted'],
      coupon_type: ['percentage', 'fixed_amount'],
      feedback_priority: ['low', 'medium', 'high', 'critical'],
      feedback_status: ['new', 'in_progress', 'resolved', 'archived'],
      feedback_type: ['bug', 'suggestion', 'praise', 'other'],
      user_role: ['owner', 'superadmin', 'admin', 'member', 'viewer'],
    },
  },
} as const;

// Export convenience types for tables
export type Project = Tables<'projects'>;
export type Organization = Tables<'organizations'>;
export type OrganizationMember = Tables<'organization_members'>;
export type Feedback = Tables<'feedback'>;
export type FeedbackMedia = Tables<'feedback_media'>;
export type Comment = Tables<'comments'>;
export type Invitation = Tables<'invitations'>;

// Export enums
export type UserRole = Enums<'user_role'>;
export type FeedbackType = Enums<'feedback_type'>;
export type FeedbackStatus = Enums<'feedback_status'>;
export type FeedbackPriority = Enums<'feedback_priority'>;
