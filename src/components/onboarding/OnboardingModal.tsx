import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Building2,
  Folder,
  Code2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { WelcomeStep } from './steps/WelcomeStep';
import { OrganizationStep } from './steps/OrganizationStep';
import { ProjectStep } from './steps/ProjectStep';
import { WidgetStep } from './steps/WidgetStep';
import { TeamStep } from './steps/TeamStep';
import { CompletionStep } from './steps/CompletionStep';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'organization', title: 'Organization', icon: Building2 },
  { id: 'project', title: 'First Project', icon: Folder },
  { id: 'widget', title: 'Widget Setup', icon: Code2 },
  { id: 'team', title: 'Invite Team', icon: Users },
  { id: 'completion', title: 'All Set!', icon: CheckCircle2 },
];

export function OnboardingModal() {
  const { showOnboarding, currentStep, setCurrentStep, completeOnboarding, skipOnboarding } =
    useOnboarding();

  const [organizationCreated, setOrganizationCreated] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
  };

  const handleSkip = async () => {
    if (
      confirm(
        'Are you sure you want to skip the onboarding? You can restart it from Settings later.'
      )
    ) {
      await skipOnboarding();
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;
      case 'organization':
        return (
          <OrganizationStep
            onNext={handleNext}
            onOrganizationCreated={() => setOrganizationCreated(true)}
          />
        );
      case 'project':
        return (
          <ProjectStep
            onNext={handleNext}
            onProjectCreated={() => setProjectCreated(true)}
            canSkip={!organizationCreated}
          />
        );
      case 'widget':
        return <WidgetStep onNext={handleNext} hasProject={projectCreated} />;
      case 'team':
        return <TeamStep onNext={handleNext} />;
      case 'completion':
        return <CompletionStep onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (!showOnboarding) {
    return null;
  }

  return (
    <Dialog open={showOnboarding} onOpenChange={() => {}}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#094765] to-[#3387a7] p-6 text-white">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{STEPS[currentStep].title}</h2>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Step {currentStep + 1} of {STEPS.length}
                  </span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex justify-between pt-2">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-white text-[#094765] shadow-lg scale-110'
                            : isCompleted
                              ? 'bg-white/80 text-[#094765]'
                              : 'bg-white/20 text-white/60'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 transition-all ${
                            isCompleted ? 'bg-white/60' : 'bg-white/20'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">{renderStep()}</div>

          {/* Footer */}
          <div className="border-t p-6 flex justify-between items-center bg-gray-50">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tour
            </button>

            {currentStep < STEPS.length - 1 && (
              <Button onClick={handleNext} className="flex items-center gap-2 magnetic-button">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
