import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Sparkles, Clock, Users, BarChart3, Shield, Zap, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PaywallModal({ isOpen, onClose, onComplete }: PaywallModalProps) {
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleGetStarted = () => {
    if (selectedPlan) {
      // Navigate to billing page with selected plan
      navigate(`/dashboard/settings/billing?plan=${selectedPlan}`);
    }
    onComplete();
  };

  const handleStartTrial = () => {
    // Just close the modal and continue to dashboard
    onComplete();
  };

  const features = [
    { icon: Clock, text: '7-day free trial included' },
    { icon: Users, text: 'Invite your team members' },
    { icon: BarChart3, text: 'Analytics and insights' },
    { icon: Shield, text: 'Enterprise-grade security' },
    { icon: Zap, text: 'Real-time notifications' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent">
        {/* Aurora Background Effects */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="aurora-light-layer aurora-light-1" />
          <div className="aurora-light-layer aurora-light-2" />
          <div className="aurora-light-layer aurora-light-3" />
        </div>

        <div className="relative glass-modern-light rounded-xl p-8">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 gradient-vibe rounded-xl shadow-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold gradient-text-modern">
                    Welcome to VibeQA!
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    Start your 7-day free trial today
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Trial Benefits */}
            <div className="relative overflow-hidden rounded-xl gradient-border">
              <div className="glass-modern p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Badge className="magnetic-button px-4 py-1.5 text-sm font-bold">
                    <Sparkles className="w-3 h-3 mr-1" />
                    FREE TRIAL
                  </Badge>
                  <span className="gradient-text-modern">Full access for 7 days</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-[var(--vibe-accent)] to-[var(--vibe-accent-hover)] shadow-sm">
                        <feature.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <h3 className="font-semibold text-xl mb-6 text-center">
                <span className="gradient-text-modern">Choose your plan</span>
                <span className="text-gray-600 text-base font-normal block mt-1">
                  You can change anytime during your trial
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {Object.values(SUBSCRIPTION_PLANS)
                  .filter((plan) => plan.id === 'basic' || plan.id === 'full')
                  .map((plan) => (
                    <Card
                      key={plan.id}
                      className={`relative p-6 cursor-pointer transition-all card-modern ${
                        selectedPlan === plan.id
                          ? 'ring-2 ring-[var(--vibe-accent)] shadow-xl transform scale-[1.02]'
                          : 'hover:shadow-lg'
                      } ${plan.id === 'full' ? 'border-[var(--vibe-accent)]' : ''}`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.id === 'full' && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="magnetic-button text-xs px-3 py-1">
                            <Star className="w-3 h-3 mr-1" />
                            RECOMMENDED
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg gradient-text-modern">{plan.name}</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                            <span className="text-gray-600 font-medium">/month</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Billed monthly after trial</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            selectedPlan === plan.id
                              ? 'border-[var(--vibe-accent)] bg-[var(--vibe-accent)]'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedPlan === plan.id && (
                            <CheckCircle className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-[var(--vibe-accent)] mt-0.5 flex-shrink-0" />
                            <span className="font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              {selectedPlan ? (
                <>
                  <Button className="flex-1 magnetic-button" onClick={handleGetStarted} size="lg">
                    <Zap className="w-5 h-5 mr-2" />
                    Start Free Trial with{' '}
                    {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS].name}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleStartTrial}
                    size="lg"
                    className="border-gray-300 hover:border-gray-400 font-semibold"
                  >
                    Skip for now
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

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 font-medium">
                🔒 No credit card required • Cancel anytime • Your data is always secure
              </p>
              <p className="text-xs text-gray-400">
                After your trial, you'll be charged monthly. You can cancel or change plans anytime.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
