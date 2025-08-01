import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import {
  AlertCircle,
  Clock,
  Users,
  FileText,
  Sparkles,
  CheckCircle,
  Star,
  Zap,
} from 'lucide-react';
import logoSvg from '@/assets/vibe-code-logo.svg';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export function TrialExpiredPage() {
  const [, navigate] = useLocation();
  const { signOut } = useAuth();
  const { organization } = useOrganization();
  const trialStatusData = useTrialStatus();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Redirect if still in trial or has active subscription
  useEffect(() => {
    console.log('[TrialExpiredPage] Trial status:', trialStatusData);

    // Only redirect if we have loaded data and status is not expired
    if (
      !trialStatusData.isLoading &&
      trialStatusData.trialStatus !== 'loading' &&
      trialStatusData.trialStatus !== 'expired'
    ) {
      console.log('[TrialExpiredPage] Redirecting to dashboard, trial is active');
      navigate('/dashboard');
    }
  }, [trialStatusData, navigate]);

  const handleGetStarted = () => {
    if (selectedPlan) {
      // Navigate to billing page with selected plan
      navigate(`/dashboard/settings/billing?plan=${selectedPlan}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Aurora Background */}
      <AnimatedBackground variant="aurora" />

      {/* Header */}
      <header className="relative z-10 px-4 py-4">
        <div className="container mx-auto">
          <nav className="glass-modern-light rounded-2xl px-8 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <img src={logoSvg} alt="VibeQA" className="h-9" />
            </div>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-900/10 font-medium"
            >
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          <div className="bg-gray-900/30 backdrop-blur-2xl border border-white/10 rounded-xl p-8">
            {/* Alert Section */}
            <div className="bg-gray-900/60 rounded-xl p-8 mb-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-4 mb-6">
                  <div className="p-3 gradient-vibe rounded-xl shadow-lg">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">Your Free Trial Has Expired</h1>
                <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                  Your 7-day free trial of VibeQA has ended. Choose a plan to continue collecting
                  feedback and accessing all features.
                </p>

                {/* Trial Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--vibe-accent)] to-[var(--vibe-accent-hover)] shadow-sm">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white font-medium">Trial ended today</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--vibe-accent)] to-[var(--vibe-accent-hover)] shadow-sm">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white font-medium">
                      {organization?.name || 'Your Organization'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--vibe-accent)] to-[var(--vibe-accent-hover)] shadow-sm">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white font-medium">All data preserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="bg-white/5 rounded-xl p-8">
              <h3 className="text-center text-xl font-semibold mb-10">
                <span className="gradient-text-accent">Choose your plan to continue</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6">
                {Object.values(SUBSCRIPTION_PLANS)
                  .filter((plan) => plan.id === 'basic' || plan.id === 'full')
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative cursor-pointer transition-all rounded-2xl p-6 backdrop-filter backdrop-blur-xl border ${
                        selectedPlan === plan.id
                          ? 'ring-2 ring-[var(--vibe-accent)] shadow-2xl transform scale-[1.02]'
                          : 'hover:shadow-xl hover:transform hover:-translate-y-1'
                      } ${
                        plan.id === 'full'
                          ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/30 shadow-[0_0_30px_rgba(255,107,53,0.3)]'
                          : 'bg-white/10 border-white/20'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.id === 'full' && (
                        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="magnetic-button text-xs px-3 py-1">
                            <Star className="w-3 h-3 mr-1" />
                            RECOMMENDED
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-white">{plan.name}</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-white">${plan.price}</span>
                            <span className="text-gray-300 font-medium">/month</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">Billed monthly</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            selectedPlan === plan.id
                              ? 'border-[var(--vibe-accent)] bg-[var(--vibe-accent)]'
                              : 'border-gray-500'
                          }`}
                        >
                          {selectedPlan === plan.id && (
                            <CheckCircle className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-[var(--vibe-accent)] mt-0.5 flex-shrink-0" />
                            <span className="font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t">
              {selectedPlan ? (
                <>
                  <Button className="flex-1 magnetic-button" onClick={handleGetStarted} size="lg">
                    <Zap className="w-5 h-5 mr-2" />
                    Subscribe to{' '}
                    {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS].name}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    size="lg"
                    className="border-gray-300 hover:border-gray-400 font-semibold"
                  >
                    Sign Out Instead
                  </Button>
                </>
              ) : (
                <Button
                  className="flex-1 magnetic-button"
                  onClick={() => setSelectedPlan('basic')}
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Select a Plan to Continue
                </Button>
              )}
            </div>

            {/* Additional Info */}
            <div className="text-center mt-8">
              <p className="text-xs text-gray-300 font-medium">
                🔒 Secure payment • Cancel anytime • Your data is always safe
              </p>
              <p className="text-xs text-gray-400 mt-2">
                All your feedback data and settings are preserved and will be accessible immediately
                after subscribing.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
