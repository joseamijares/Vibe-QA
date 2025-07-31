import { useEffect, useState } from 'react';
import { useOrganization } from './useOrganization';
import { supabase } from '@/lib/supabase';

interface TrialStatus {
  isInTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  trialStatus: 'active' | 'converted' | 'canceled' | 'expired';
  isLoading: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { organization } = useOrganization();
  const [trialData, setTrialData] = useState<TrialStatus>({
    isInTrial: false,
    trialEndsAt: null,
    daysRemaining: 0,
    trialStatus: 'expired',
    isLoading: true,
  });

  useEffect(() => {
    if (!organization) {
      setTrialData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    async function fetchTrialStatus() {
      try {
        const { data, error } = await supabase
          .from('organization_trial_status')
          .select('*')
          .eq('organization_id', organization!.id)
          .single();

        if (error) {
          console.error('Error fetching trial status:', error);
          setTrialData((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        if (data) {
          setTrialData({
            isInTrial: data.trial_status === 'active',
            trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
            daysRemaining: data.days_remaining || 0,
            trialStatus: data.trial_status,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error in useTrialStatus:', error);
        setTrialData((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchTrialStatus();

    // Set up realtime subscription for trial status changes
    const subscription = supabase
      .channel(`trial-status-${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_subscriptions',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          fetchTrialStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [organization]);

  return trialData;
}

// Helper hook to check if a feature should be blocked due to trial expiration
export function useTrialBlock() {
  const trialStatus = useTrialStatus();
  const { subscription } = useSubscription();

  const isBlocked =
    !trialStatus.isLoading &&
    trialStatus.trialStatus === 'expired' &&
    (!subscription || subscription.status !== 'active');

  return {
    isBlocked,
    trialStatus,
    message: isBlocked
      ? 'Your free trial has expired. Please upgrade to continue using VibeQA.'
      : null,
  };
}

// Import useSubscription to avoid circular dependency
import { useSubscription } from './useSubscription';
