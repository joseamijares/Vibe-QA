import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscription } from '@/hooks/useSubscription';
import { usePermissions } from '@/hooks/usePermissions';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingCard } from '@/components/billing/PricingCard';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY
);

export function BillingPage() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const { session } = useAuth();
  const { organization } = useOrganization();
  const { subscription, plan, loading: subLoading } = useSubscription();
  const { canManageBilling } = usePermissions();
  const { isInTrial, daysRemaining } = useTrialStatus();
  const [isLoading, setIsLoading] = useState(false);

  // Handle success/cancel from Stripe and plan selection
  useEffect(() => {
    if (searchParams.includes('success=true')) {
      toast.success('Subscription updated successfully!');
      // Clear URL params
      navigate('/dashboard/settings/billing', { replace: true });
    } else if (searchParams.includes('canceled=true')) {
      toast.info('Subscription update canceled');
      navigate('/dashboard/settings/billing', { replace: true });
    }

    // Check if a plan was passed in the URL (from paywall modal)
    const urlParams = new URLSearchParams(searchParams);
    const planParam = urlParams.get('plan');
    if (planParam && !subLoading && organization) {
      // Auto-select the plan
      handlePlanSelect(planParam);
      // Clear the plan param
      navigate('/dashboard/settings/billing', { replace: true });
    }
  }, [searchParams, navigate, subLoading, organization]);

  // Check permissions
  useEffect(() => {
    if (!subLoading && !canManageBilling) {
      toast.error('You do not have permission to manage billing');
      navigate('/dashboard');
    }
  }, [canManageBilling, navigate, subLoading]);

  const handlePlanSelect = async (planId: string) => {
    if (!organization || !session?.user) return;

    setIsLoading(true);
    try {
      // Get the current session token
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        throw new Error('No active session');
      }

      // Use Supabase Edge Function for Stripe checkout
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({
            planId,
            organizationId: organization.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!organization || !session?.access_token) return;

    setIsLoading(true);
    try {
      // Call Edge Function to create portal session
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            organizationId: organization.id,
            returnUrl: window.location.href,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast.error('Failed to open customer portal');
    } finally {
      setIsLoading(false);
    }
  };

  if (subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      {subscription && plan && (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Current Plan: {plan.name}
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
                {isInTrial && (
                  <Badge variant="outline" className="border-blue-600 text-blue-600">
                    Trial - {daysRemaining} days left
                  </Badge>
                )}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isInTrial ? (
                  <>Free trial ends in {daysRemaining} days</>
                ) : (
                  <>
                    {subscription.currentPeriodEnd && subscription.status === 'active' && (
                      <>Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                    )}
                    {subscription.cancelAt && (
                      <>Cancels on {new Date(subscription.cancelAt).toLocaleDateString()}</>
                    )}
                  </>
                )}
              </p>
            </div>
            {subscription.status === 'active' && (
              <Button variant="outline" onClick={handleManageSubscription}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            )}
          </div>

          {/* Usage */}
          {subscription.usage && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Projects</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold">
                    {subscription.usage.projects}
                    <span className="text-sm text-muted-foreground">/{plan.limits.projects}</span>
                  </p>
                  {subscription.usage.projects >= plan.limits.projects && (
                    <Badge variant="destructive" className="text-xs">
                      Limit reached
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      subscription.usage.projects >= plan.limits.projects
                        ? 'bg-destructive'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((subscription.usage.projects / plan.limits.projects) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Feedback this month</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold">
                    {subscription.usage.feedbackThisMonth.toLocaleString()}
                    <span className="text-sm text-muted-foreground">
                      /{plan.limits.feedbackPerMonth.toLocaleString()}
                    </span>
                  </p>
                  {subscription.usage.feedbackThisMonth >= plan.limits.feedbackPerMonth && (
                    <Badge variant="destructive" className="text-xs">
                      Limit reached
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      subscription.usage.feedbackThisMonth >= plan.limits.feedbackPerMonth
                        ? 'bg-destructive'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((subscription.usage.feedbackThisMonth / plan.limits.feedbackPerMonth) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Team members</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold">
                    {subscription.usage.teamMembers}
                    <span className="text-sm text-muted-foreground">
                      /{plan.limits.teamMembers}
                    </span>
                  </p>
                  {subscription.usage.teamMembers >= plan.limits.teamMembers && (
                    <Badge variant="destructive" className="text-xs">
                      Limit reached
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      subscription.usage.teamMembers >= plan.limits.teamMembers
                        ? 'bg-destructive'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((subscription.usage.teamMembers / plan.limits.teamMembers) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Storage used</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold">
                    {subscription.usage.storageGB}GB
                    <span className="text-sm text-muted-foreground">
                      /{plan.limits.storageGB}GB
                    </span>
                  </p>
                  {subscription.usage.storageGB >= plan.limits.storageGB && (
                    <Badge variant="destructive" className="text-xs">
                      Limit reached
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      subscription.usage.storageGB >= plan.limits.storageGB
                        ? 'bg-destructive'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((subscription.usage.storageGB / plan.limits.storageGB) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={subscription?.planId}
              isLoading={isLoading}
              onSelect={handlePlanSelect}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Billing Information</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>All plans include a 7-day free trial</li>
              <li>No credit card required during trial</li>
              <li>Cancel or change your plan anytime</li>
              <li>Prices are in USD and billed monthly</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
