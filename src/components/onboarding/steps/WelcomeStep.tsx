import { Button } from '@/components/ui/button';
import { Sparkles, Target, Zap, Shield } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Welcome to VibeQA!</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Let's get you set up in just a few minutes. We'll help you create your organization, set
          up your first project, and show you how to start collecting feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 space-y-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Collect Feedback</h4>
          <p className="text-sm text-gray-600">
            Gather user feedback with our easy-to-embed widget
          </p>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 space-y-2">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Real-time Updates</h4>
          <p className="text-sm text-gray-600">
            Get instant notifications when users submit feedback
          </p>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 space-y-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Secure & Private</h4>
          <p className="text-sm text-gray-600">
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">7-Day Free Trial:</span> You have full access to all
          features during your trial period. No credit card required!
        </p>
      </div>

      <div className="text-center">
        <Button onClick={onNext} size="lg" className="magnetic-button px-8">
          Let's Get Started
        </Button>
      </div>
    </div>
  );
}
