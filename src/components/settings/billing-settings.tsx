'use client';

import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function BillingSettings() {
  const [, navigate] = useLocation();
  const { subscription, plan, loading } = useSubscription();

  // Since we already have a dedicated billing page, we'll show a summary here
  // and link to the full billing page for detailed management

  if (loading) {
    return <div className="text-center py-8">Loading billing information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">{plan?.name || 'Free Plan'}</p>
            </div>
          </div>
          <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
            {subscription?.status || 'No subscription'}
          </Badge>
        </div>

        {subscription && subscription.currentPeriodEnd && (
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Next billing date</p>
            <p className="font-medium">
              {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
            </p>
          </div>
        )}

        {plan && (
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Plan includes</p>
            <ul className="space-y-1 text-sm">
              <li>• {plan.limits?.projects || 'Unlimited'} projects</li>
              <li>• {plan.limits?.feedbackPerMonth || 'Unlimited'} feedback per month</li>
              <li>• {plan.limits?.teamMembers || 'Unlimited'} team members</li>
              {plan.limits && 'historyDays' in plan.limits && (
                <li>• {(plan.limits as any).historyDays} days feedback history</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <p className="text-sm text-muted-foreground mb-4">
          Manage your subscription, payment methods, and view invoices in the billing portal.
        </p>
        <Button
          onClick={() => navigate('/dashboard/settings/billing')}
          className="flex items-center gap-2"
        >
          Manage Billing
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
