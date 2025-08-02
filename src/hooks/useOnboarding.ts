import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';

interface OnboardingState {
  showOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  currentStep: number;
  isLoading: boolean;
}

const ONBOARDING_KEY = 'vibeqa_onboarding_completed';
const ONBOARDING_STEP_KEY = 'vibeqa_onboarding_step';

export function useOnboarding() {
  const { session } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const [state, setState] = useState<OnboardingState>({
    showOnboarding: false,
    hasCompletedOnboarding: false,
    currentStep: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!session?.user || orgLoading) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    checkOnboardingStatus();
  }, [session, organization, orgLoading]);

  const checkOnboardingStatus = async () => {
    try {
      // Check localStorage first for quick access
      const localCompleted = localStorage.getItem(`${ONBOARDING_KEY}_${session!.user.id}`);
      const savedStep = localStorage.getItem(`${ONBOARDING_STEP_KEY}_${session!.user.id}`);

      if (localCompleted === 'true') {
        setState({
          showOnboarding: false,
          hasCompletedOnboarding: true,
          currentStep: 0,
          isLoading: false,
        });
        return;
      }

      // Check user metadata
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const hasCompletedFromMeta = user?.user_metadata?.has_completed_onboarding === true;

      if (hasCompletedFromMeta) {
        // Sync with localStorage
        localStorage.setItem(`${ONBOARDING_KEY}_${session!.user.id}`, 'true');
        setState({
          showOnboarding: false,
          hasCompletedOnboarding: true,
          currentStep: 0,
          isLoading: false,
        });
        return;
      }

      // Determine if we should show onboarding
      const shouldShowOnboarding = !organization || !hasCompletedFromMeta;

      setState({
        showOnboarding: shouldShowOnboarding,
        hasCompletedOnboarding: false,
        currentStep: savedStep ? parseInt(savedStep, 10) : 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const startOnboarding = () => {
    setState((prev) => ({ ...prev, showOnboarding: true, currentStep: 0 }));
  };

  const completeOnboarding = async () => {
    try {
      // Update user metadata
      await supabase.auth.updateUser({
        data: { has_completed_onboarding: true },
      });

      // Update localStorage
      localStorage.setItem(`${ONBOARDING_KEY}_${session!.user.id}`, 'true');
      localStorage.removeItem(`${ONBOARDING_STEP_KEY}_${session!.user.id}`);

      setState({
        showOnboarding: false,
        hasCompletedOnboarding: true,
        currentStep: 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  const setCurrentStep = (step: number) => {
    localStorage.setItem(`${ONBOARDING_STEP_KEY}_${session!.user.id}`, step.toString());
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  const resetOnboarding = () => {
    localStorage.removeItem(`${ONBOARDING_KEY}_${session!.user.id}`);
    localStorage.removeItem(`${ONBOARDING_STEP_KEY}_${session!.user.id}`);
    setState({
      showOnboarding: true,
      hasCompletedOnboarding: false,
      currentStep: 0,
      isLoading: false,
    });
  };

  return {
    ...state,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    setCurrentStep,
    resetOnboarding,
  };
}
