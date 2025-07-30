import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscription } from '@/hooks/useSubscription';
import { usePermissions } from '@/hooks/usePermissions';
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
  const [isLoading, setIsLoading] = useState(false);

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams.includes('success=true')) {
      toast.success('Subscription updated successfully!');
      // Clear URL params
      navigate('/dashboard/settings/billing', { replace: true });
    } else if (searchParams.includes('canceled=true')) {
      toast.info('Subscription update canceled');
      navigate('/dashboard/settings/billing', { replace: true });
    }
  }, [searchParams, navigate]);

  // Check permissions
  useEffect(() => {
    if (!subLoading && !canManageBilling) {
      toast.error('You do not have permission to manage billing');
      navigate('/dashboard');
    }
  }, [canManageBilling, navigate, subLoading]);

  const handlePlanSelect = async (planId: string) => {
    if (!organization || !session?.user) return;

    if (planId === 'enterprise') {
      window.open('mailto:sales@vibeqa.app?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    if (planId === 'free' && subscription?.planId !== 'free') {
      // Handle downgrade to free
      toast.info('Please contact support to downgrade your plan');
      return;
    }

    setIsLoading(true);
    try {
      // Use Supabase Edge Function for Stripe checkout
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            planId,
            organizationId: organization.id,
            userId: session.user.id,
            email: session.user.email,
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
    // Create portal session for managing existing subscription
    toast.info('Customer portal coming soon');
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
              </h2>
              <p className="text-muted-foreground mt-1">
                {subscription.currentPeriodEnd && subscription.status === 'active' && (
                  <>Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
                {subscription.cancelAt && (
                  <>Cancels on {new Date(subscription.cancelAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
            {subscription.planId !== 'free' && subscription.status === 'active' && (
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
                <p className="text-2xl font-semibold">
                  {subscription.usage.projects}
                  {plan.limits.projects !== -1 && (
                    <span className="text-sm text-muted-foreground">/{plan.limits.projects}</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Feedback this month</p>
                <p className="text-2xl font-semibold">
                  {subscription.usage.feedbackThisMonth.toLocaleString()}
                  {plan.limits.feedbackPerMonth !== -1 && (
                    <span className="text-sm text-muted-foreground">
                      /{plan.limits.feedbackPerMonth.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Team members</p>
                <p className="text-2xl font-semibold">
                  {subscription.usage.teamMembers}
                  {plan.limits.teamMembers !== -1 && (
                    <span className="text-sm text-muted-foreground">
                      /{plan.limits.teamMembers}
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Storage used</p>
                <p className="text-2xl font-semibold">
                  {subscription.usage.storageGB}GB
                  {plan.limits.storageGB !== -1 && (
                    <span className="text-sm text-muted-foreground">
                      /{plan.limits.storageGB}GB
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <li>All plans include a 14-day free trial</li>
              <li>No credit card required for the free plan</li>
              <li>Cancel or change your plan anytime</li>
              <li>Prices are in USD and billed monthly</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
