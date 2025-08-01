import { useTrialStatus } from '@/hooks/useTrialStatus';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export function TrialBanner() {
  const { isInTrial, daysRemaining, isLoading } = useTrialStatus();
  const [isVisible, setIsVisible] = useState(true);
  const [, navigate] = useLocation();

  // Check if banner was dismissed recently
  useEffect(() => {
    const dismissedData = localStorage.getItem('trial-banner-dismissed');
    if (dismissedData) {
      try {
        const { timestamp, daysRemaining: dismissedDays } = JSON.parse(dismissedData);
        const dismissedTime = new Date(timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursSinceDismissed = (currentTime - dismissedTime) / (1000 * 60 * 60);

        // Show banner again if:
        // 1. More than 24 hours have passed, OR
        // 2. Days remaining has changed (trial is ending sooner)
        if (hoursSinceDismissed < 24 && dismissedDays === daysRemaining) {
          setIsVisible(false);
        }
      } catch (e) {
        // If parsing fails, show the banner
        localStorage.removeItem('trial-banner-dismissed');
      }
    }
  }, [daysRemaining]);

  if (isLoading || !isInTrial || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal with timestamp and current days remaining
    localStorage.setItem(
      'trial-banner-dismissed',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        daysRemaining: daysRemaining,
      })
    );
  };

  const handleUpgrade = () => {
    navigate('/dashboard/settings/billing');
  };

  // Determine banner urgency
  const isUrgent = daysRemaining <= 3;

  return (
    <div className="relative px-4 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
      <div className="max-w-7xl mx-auto">
        <div className="glass-modern-light rounded-xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${isUrgent ? 'bg-orange-100' : 'bg-orange-50'}`}>
              {isUrgent ? (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              ) : (
                <Sparkles className="h-5 w-5 text-orange-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-900">
              <p className="font-semibold">
                {daysRemaining === 0
                  ? 'Your free trial ends today!'
                  : daysRemaining === 1
                    ? 'Your free trial ends tomorrow'
                    : `${daysRemaining} days left in your free trial`}
              </p>
              <span className="hidden sm:inline text-gray-600">•</span>
              <span className="hidden sm:inline text-gray-600">
                Unlock all features and remove limits
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleUpgrade}
              className="magnetic-button rounded-full px-6 group"
            >
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
