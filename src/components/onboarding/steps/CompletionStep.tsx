import { Button } from '@/components/ui/button';
import { CheckCircle2, Rocket, BookOpen, HeadphonesIcon, CreditCard } from 'lucide-react';
import { useLocation } from 'wouter';

interface CompletionStepProps {
  onComplete: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    onComplete();
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce-gentle">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">You're All Set!</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Congratulations! Your VibeQA account is ready. Here's what you can do next:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/dashboard/projects')}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Rocket className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Start Collecting Feedback</h4>
              <p className="text-sm text-gray-600 mt-1">
                Embed the widget and start receiving user feedback
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/dashboard/settings/billing')}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Choose a Plan</h4>
              <p className="text-sm text-gray-600 mt-1">
                Select a plan that fits your needs after the trial
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => window.open('/docs', '_blank')}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Read Documentation</h4>
              <p className="text-sm text-gray-600 mt-1">
                Learn about advanced features and integrations
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => window.open('mailto:support@vibeqa.com', '_blank')}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <HeadphonesIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Get Support</h4>
              <p className="text-sm text-gray-600 mt-1">Our team is here to help you succeed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="text-center space-y-2">
          <h4 className="font-semibold text-gray-900">Your 7-Day Trial Has Started</h4>
          <p className="text-sm text-gray-600">
            You have full access to all features. No credit card required during the trial.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={handleGetStarted} size="lg" className="magnetic-button px-8">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
