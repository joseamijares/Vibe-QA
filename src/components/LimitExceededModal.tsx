import { AlertCircle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { useLocation } from 'wouter';

interface LimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'projects' | 'feedback' | 'teamMembers' | 'storage';
  currentPlan: string;
  currentUsage: number;
  limit: number;
}

export function LimitExceededModal({
  isOpen,
  onClose,
  limitType,
  currentPlan,
  currentUsage,
  limit,
}: LimitExceededModalProps) {
  const [, navigate] = useLocation();

  const limitMessages = {
    projects: {
      title: 'Project Limit Reached',
      description: `You've reached the maximum number of projects (${limit}) for your ${currentPlan} plan.`,
      benefit: 'Create more projects to organize feedback across different applications',
    },
    feedback: {
      title: 'Monthly Feedback Limit Reached',
      description: `You've reached your monthly feedback limit (${limit.toLocaleString()}) for the ${currentPlan} plan.`,
      benefit: 'Collect unlimited feedback from your users',
    },
    teamMembers: {
      title: 'Team Member Limit Reached',
      description: `You've reached the maximum team members (${limit}) for your ${currentPlan} plan.`,
      benefit: 'Add more team members to collaborate on feedback',
    },
    storage: {
      title: 'Storage Limit Reached',
      description: `You've reached your storage limit (${limit}GB) for the ${currentPlan} plan.`,
      benefit: 'Store more screenshots, audio recordings, and attachments',
    },
  };

  const message = limitMessages[limitType];

  // Find upgrade options
  const currentPlanObj = Object.values(SUBSCRIPTION_PLANS).find(
    (p) => p.name.toLowerCase() === currentPlan.toLowerCase()
  );
  const upgradePlans = Object.values(SUBSCRIPTION_PLANS).filter((plan) => {
    if (plan.id === currentPlanObj?.id) return false;

    const planLimit =
      plan.limits[
        limitType === 'feedback'
          ? 'feedbackPerMonth'
          : limitType === 'storage'
            ? 'storageGB'
            : limitType
      ];
    return planLimit > limit;
  });

  const handleUpgrade = (planId: string) => {
    navigate(`/dashboard/settings/billing?plan=${planId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>{message.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {message.description} Upgrade your plan to {message.benefit}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-1">Current Usage</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{currentUsage.toLocaleString()}</span>
              <span className="text-muted-foreground">
                / {limit === -1 ? 'Unlimited' : limit.toLocaleString()}
              </span>
            </div>
          </div>

          {upgradePlans.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Upgrade Options</p>
              {upgradePlans.map((plan) => {
                const planLimit =
                  plan.limits[
                    limitType === 'feedback'
                      ? 'feedbackPerMonth'
                      : limitType === 'storage'
                        ? 'storageGB'
                        : limitType
                  ];
                const limitDisplay = planLimit.toLocaleString();

                return (
                  <button
                    key={plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full text-left p-4 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {plan.name}
                          {plan.id === 'full' && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {limitDisplay} {limitType === 'feedback' ? 'feedback/month' : limitType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${plan.price}/mo</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {upgradePlans.length === 0 ? (
            <Button
              onClick={() =>
                window.open('mailto:sales@vibeqa.app?subject=Custom Plan Inquiry', '_blank')
              }
            >
              Contact Sales
            </Button>
          ) : (
            <Button onClick={() => navigate('/dashboard/settings/billing')}>View All Plans</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
