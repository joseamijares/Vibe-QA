import { useEffect, useState } from 'react';
import { useOrganization } from './useOrganization';
import { useSubscription } from './useSubscription';
import { supabase } from '@/lib/supabase';

interface TrialStatus {
  isInTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  trialStatus: 'active' | 'converted' | 'canceled' | 'expired' | 'loading';
  isLoading: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { organization } = useOrganization();
  const [trialData, setTrialData] = useState<TrialStatus>({
    isInTrial: false,
    trialEndsAt: null,
    daysRemaining: 0,
    trialStatus: 'loading', // Changed from 'expired' to 'loading'
    isLoading: true,
  });

  useEffect(() => {
    if (!organization) {
      setTrialData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    let isMounted = true;

    const orgId = organization.id; // organization is guaranteed to exist here

    async function fetchTrialStatus() {
      try {
        console.log('[useTrialStatus] Fetching trial status for org:', orgId);

        const { data, error } = await supabase
          .from('organization_trial_status')
          .select('*')
          .eq('organization_id', orgId)
          .single();

        if (!isMounted) return;

        if (error) {
          console.error('[useTrialStatus] Error fetching trial status:', error);
          setTrialData((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        if (data) {
          console.log('[useTrialStatus] Trial data received:', {
            organization_id: data.organization_id,
            trial_status: data.trial_status,
            trial_ends_at: data.trial_ends_at,
            days_remaining: data.days_remaining,
            subscription_status: data.subscription_status,
            plan_id: data.plan_id,
          });

          setTrialData({
            isInTrial: data.trial_status === 'active',
            trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
            daysRemaining: data.days_remaining || 0,
            trialStatus: data.trial_status,
            isLoading: false,
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[useTrialStatus] Exception in fetchTrialStatus:', error);
        setTrialData((prev) => ({ ...prev, isLoading: false }));
      }
    }

    // Set up realtime subscription for trial status changes
    const subscription = supabase
      .channel(`trial-status-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_subscriptions',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          if (isMounted) {
            fetchTrialStatus();
          }
        }
      )
      .subscribe();

    // Initial fetch
    fetchTrialStatus();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [organization]);

  return trialData;
}

// Helper hook to check if a feature should be blocked due to trial expiration
export function useTrialBlock() {
  const trialStatus = useTrialStatus();
  const { subscription } = useSubscription();

  console.log('[useTrialBlock] Checking trial block status:', {
    isLoading: trialStatus.isLoading,
    trialStatus: trialStatus.trialStatus,
    isInTrial: trialStatus.isInTrial,
    daysRemaining: trialStatus.daysRemaining,
    subscriptionStatus: subscription?.status,
    subscriptionPlan: subscription?.planId,
  });

  const isBlocked =
    !trialStatus.isLoading &&
    trialStatus.trialStatus !== 'loading' && // Make sure data is loaded
    trialStatus.trialStatus === 'expired' &&
    (!subscription || subscription.status !== 'active');

  console.log('[useTrialBlock] Result:', { isBlocked });

  return {
    isBlocked,
    trialStatus,
    message: isBlocked
      ? 'Your free trial has expired. Please upgrade to continue using VibeQA.'
      : null,
  };
}
