import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Sparkles, Clock, Users, BarChart3, Shield, Zap, X } from 'lucide-react';
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
    if (selectedPlan && selectedPlan !== 'free') {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Welcome to VibeQA!</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Start your 7-day free trial today</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Trial Benefits */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                FREE TRIAL
              </Badge>
              Full access for 7 days
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <feature.icon className="h-4 w-4 text-blue-600" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Plan Selection */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              Choose your plan (you can change anytime)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(SUBSCRIPTION_PLANS)
                .filter((plan) => plan.id !== 'enterprise')
                .map((plan) => (
                  <Card
                    key={plan.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'ring-2 ring-blue-600 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{plan.name}</h4>
                        <p className="text-2xl font-bold mt-1">
                          {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          selectedPlan === plan.id
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedPlan === plan.id && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-green-600 mt-0.5">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {selectedPlan && selectedPlan !== 'free' ? (
              <>
                <Button className="flex-1" onClick={handleGetStarted} size="lg">
                  Start Free Trial & Subscribe to{' '}
                  {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS].name}
                </Button>
                <Button variant="outline" onClick={handleStartTrial} size="lg">
                  Just Start Free Trial
                </Button>
              </>
            ) : (
              <Button className="flex-1" onClick={handleStartTrial} size="lg">
                Start Your Free Trial
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-gray-500">
            No credit card required for free trial • Cancel anytime • Your data is always secure
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
