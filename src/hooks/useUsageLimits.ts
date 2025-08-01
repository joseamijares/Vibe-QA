import { useEffect, useState } from 'react';
import { useOrganization } from './useOrganization';
import { supabase } from '@/lib/supabase';

interface OrganizationLimitsResponse {
  plan_id: string;
  project_limit: number;
  feedback_limit: number;
  team_member_limit: number;
  storage_limit_gb: number;
  current_projects: number;
  current_feedback: number;
  current_team_members: number;
  current_storage_gb: number;
}

interface UsageLimits {
  planId: string;
  projectLimit: number;
  feedbackLimit: number;
  teamMemberLimit: number;
  storageLimit: number;
  currentProjects: number;
  currentFeedback: number;
  currentTeamMembers: number;
  currentStorage: number;
  canCreateProject: boolean;
  canSubmitFeedback: boolean;
  canAddTeamMember: boolean;
  isAtProjectLimit: boolean;
  isAtFeedbackLimit: boolean;
  isAtTeamMemberLimit: boolean;
}

export function useUsageLimits() {
  const { organization } = useOrganization();
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organization) {
      setLimits(null);
      setLoading(false);
      return;
    }

    async function fetchLimits() {
      try {
        // Get organization limits and usage in one call
        const { data, error: limitsError } = (await supabase
          .rpc('get_organization_limits', { org_id: organization!.id })
          .single()) as { data: OrganizationLimitsResponse | null; error: any };

        if (limitsError) throw limitsError;

        if (data) {
          const canCreateProject =
            data.project_limit === -1 || data.current_projects < data.project_limit;
          const canSubmitFeedback =
            data.feedback_limit === -1 || data.current_feedback < data.feedback_limit;
          const canAddTeamMember =
            data.team_member_limit === -1 || data.current_team_members < data.team_member_limit;

          setLimits({
            planId: data.plan_id || 'basic',
            projectLimit: data.project_limit || 3,
            feedbackLimit: data.feedback_limit || 500,
            teamMemberLimit: data.team_member_limit || 5,
            storageLimit: data.storage_limit_gb || 5,
            currentProjects: data.current_projects || 0,
            currentFeedback: data.current_feedback || 0,
            currentTeamMembers: data.current_team_members || 0,
            currentStorage: data.current_storage_gb || 0,
            canCreateProject,
            canSubmitFeedback,
            canAddTeamMember,
            isAtProjectLimit: !canCreateProject,
            isAtFeedbackLimit: !canSubmitFeedback,
            isAtTeamMemberLimit: !canAddTeamMember,
          });
        }
      } catch (err) {
        console.error('Error fetching usage limits:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchLimits();

    // Subscribe to usage changes
    const subscription = supabase
      .channel('usage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_usage',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          fetchLimits();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          fetchLimits();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [organization]);

  const checkCanCreateProject = async (): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { data, error } = await supabase.rpc('can_create_project', { org_id: organization.id });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Error checking project limit:', err);
      return false;
    }
  };

  const checkCanSubmitFeedback = async (): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { data, error } = await supabase.rpc('can_submit_feedback', {
        org_id: organization.id,
      });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Error checking feedback limit:', err);
      return false;
    }
  };

  return {
    limits,
    loading,
    error,
    checkCanCreateProject,
    checkCanSubmitFeedback,
  };
}
