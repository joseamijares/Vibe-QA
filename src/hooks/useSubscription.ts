import { useEffect, useState } from 'react';
import { useOrganization } from './useOrganization';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, PlanId } from '@/lib/stripe';

interface SubscriptionData {
  planId: PlanId;
  status: string;
  currentPeriodEnd?: string;
  cancelAt?: string;
  usage?: {
    projects: number;
    feedbackThisMonth: number;
    teamMembers: number;
    storageGB: number;
  };
}

export function useSubscription() {
  const { organization } = useOrganization();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organization) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        // Get subscription details
        const { data: subData, error: subError } = await supabase
          .from('organization_subscriptions')
          .select('*')
          .eq('organization_id', organization!.id)
          .single();

        if (subError && subError.code !== 'PGRST116') {
          throw subError;
        }

        // Get current usage
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
        const { data: usageData } = await supabase
          .from('organization_usage')
          .select('feedback_count, storage_bytes')
          .eq('organization_id', organization!.id)
          .eq('month', currentMonth)
          .single();

        // Count projects
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization!.id);

        // Count team members
        const { count: memberCount } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization!.id);

        const planId = (subData?.plan_id || organization?.subscription_plan_id || 'free') as PlanId;

        setSubscription({
          planId,
          status: subData?.status || organization?.subscription_status || 'trialing',
          currentPeriodEnd: subData?.current_period_end,
          cancelAt: subData?.cancel_at,
          usage: {
            projects: projectCount || 0,
            feedbackThisMonth: usageData?.feedback_count || 0,
            teamMembers: memberCount || 0,
            storageGB: usageData ? Math.round((usageData.storage_bytes / 1073741824) * 10) / 10 : 0,
          },
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [organization]);

  const plan = subscription ? SUBSCRIPTION_PLANS[subscription.planId] : null;

  return {
    subscription,
    plan,
    loading,
    error,
  };
}
