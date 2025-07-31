import { useTrialStatus } from '@/hooks/useTrialStatus';
import { Button } from '@/components/ui/button';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export function TrialBanner() {
  const { isInTrial, daysRemaining, isLoading } = useTrialStatus();
  const [isVisible, setIsVisible] = useState(true);
  const [, navigate] = useLocation();

  // Check if banner was dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('trial-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  if (isLoading || !isInTrial || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('trial-banner-dismissed', 'true');
  };

  const handleUpgrade = () => {
    navigate('/dashboard/settings/billing');
  };

  // Determine banner style based on days remaining
  const isUrgent = daysRemaining <= 3;
  const bannerClass = isUrgent
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';
  const iconClass = isUrgent ? 'text-red-600' : 'text-blue-600';

  return (
    <div className={`relative px-4 py-3 border-b ${bannerClass}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isUrgent ? (
            <AlertTriangle className={`h-5 w-5 ${iconClass}`} />
          ) : (
            <Clock className={`h-5 w-5 ${iconClass}`} />
          )}
          <p className="font-medium">
            {daysRemaining === 0
              ? 'Your free trial ends today!'
              : daysRemaining === 1
                ? 'Your free trial ends tomorrow'
                : `${daysRemaining} days left in your free trial`}
          </p>
          <span className="text-sm opacity-75">Unlock all features and remove limits</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isUrgent ? 'default' : 'outline'}
            onClick={handleUpgrade}
            className={isUrgent ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Upgrade Now
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-black/5 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
