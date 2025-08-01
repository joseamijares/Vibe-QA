import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionPlan } from '@/lib/stripe';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  plan: SubscriptionPlan;
  currentPlan?: string;
  isLoading?: boolean;
  onSelect: (planId: string) => void;
}

export function PricingCard({ plan, currentPlan, isLoading, onSelect }: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.id;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        isCurrentPlan && 'ring-2 ring-primary',
        !isCurrentPlan && 'hover:shadow-lg'
      )}
    >
      {plan.id === 'full' && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg">Most Popular</Badge>
        </div>
      )}

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <div className="mt-2 flex items-baseline gap-1">
            {plan.price !== null ? (
              <>
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </>
            ) : (
              <span className="text-2xl font-semibold text-muted-foreground">Custom pricing</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          {isCurrentPlan ? (
            <Button className="w-full" disabled variant="outline">
              Current Plan
            </Button>
          ) : (
            <Button className="w-full" disabled={isLoading} onClick={() => onSelect(plan.id)}>
              {currentPlan === 'basic' && plan.id === 'full' ? 'Upgrade' : 'Switch'} to {plan.name}
            </Button>
          )}
        </div>
      </div>

      {/* Usage limits */}
      <div className="border-t px-6 py-4 bg-muted/50">
        <h4 className="text-sm font-semibold mb-2">Limits</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Projects: {plan.limits.projects}</div>
          <div>Feedback/month: {plan.limits.feedbackPerMonth.toLocaleString()}</div>
          <div>Team members: {plan.limits.teamMembers}</div>
          <div>Storage: {plan.limits.storageGB}GB</div>
        </div>
      </div>
    </Card>
  );
}
