import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PricingCard } from '@/components/billing/PricingCard';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { AlertCircle, Clock, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function TrialExpiredPage() {
  const [, navigate] = useLocation();
  const { signOut } = useAuth();
  const { organization } = useOrganization();
  const { trialStatus } = useTrialStatus();

  // Redirect if still in trial or has active subscription
  useEffect(() => {
    if (trialStatus !== 'expired') {
      navigate('/dashboard');
    }
  }, [trialStatus, navigate]);

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') {
      toast.info('You are currently on the free plan after trial expiration');
      return;
    }

    if (planId === 'enterprise') {
      window.open('mailto:sales@vibeqa.app?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    // Navigate to billing page which will handle the checkout
    navigate(`/dashboard/settings/billing?plan=${planId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">VibeQA</h1>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          {/* Alert Card */}
          <Card className="p-8 mb-8 border-red-200 bg-red-50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Free Trial Has Expired
                </h2>
                <p className="text-gray-700 mb-4">
                  Your 7-day free trial of VibeQA has ended. To continue collecting feedback and
                  accessing your data, please select a subscription plan below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span>Trial ended on {new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span>{organization?.name || 'Your Organization'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span>All data preserved</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Plans */}
          <div>
            <h3 className="text-center text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
            <p className="text-center text-gray-600 mb-8">
              Select the plan that best fits your team's needs
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  currentPlan={undefined}
                  isLoading={false}
                  onSelect={handlePlanSelect}
                />
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Need help choosing? Contact our sales team at{' '}
              <a href="mailto:sales@vibeqa.app" className="text-blue-600 hover:text-blue-700">
                sales@vibeqa.app
              </a>
            </p>
            <p className="text-xs text-gray-500">
              Your data is safe and will be fully accessible once you subscribe. Free plan users
              have limited access to historical data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
