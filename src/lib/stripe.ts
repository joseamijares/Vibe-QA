import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY
);

// Note: Stripe must be initialized with a valid publishable key
// Get your key from https://dashboard.stripe.com/apikeys

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '1 project',
      '100 feedback per month',
      'Basic support',
      'Screenshot capture',
      '7-day data retention',
    ],
    limits: {
      projects: 1,
      feedbackPerMonth: 100,
      teamMembers: 2,
      storageGB: 1,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 5,
    priceId: '', // To be filled with Stripe price ID
    features: [
      '3 projects included',
      '500 bug reports/month',
      '30-day history',
      'Email support',
      'Basic integrations',
      'Team collaboration',
    ],
    limits: {
      projects: 3,
      feedbackPerMonth: 500,
      teamMembers: 5,
      storageGB: 5,
    },
  },
  full: {
    id: 'full',
    name: 'Full Plan',
    price: 14,
    priceId: '', // To be filled with Stripe price ID
    features: [
      '10 projects',
      '2,000 bug reports/month',
      '90-day history',
      'Priority support',
      'Advanced integrations',
      'Custom workflows',
      'Analytics dashboard',
    ],
    limits: {
      projects: 10,
      feedbackPerMonth: 2000,
      teamMembers: 20,
      storageGB: 20,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceId: null,
    features: [
      'Unlimited projects',
      'Unlimited feedback',
      'Dedicated support',
      'All features',
      'Custom integrations',
      'SSO/SAML',
      'SLA guarantee',
      'White-label options',
      'Advanced security',
    ],
    limits: {
      projects: -1, // Unlimited
      feedbackPerMonth: -1,
      teamMembers: -1,
      storageGB: -1,
    },
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[PlanId];

// Helper to check if a feature is available for a plan
export function isPlanFeatureAvailable(planId: PlanId, feature: string): boolean {
  const plan = SUBSCRIPTION_PLANS[planId];
  return plan.features.some((f) => f.toLowerCase().includes(feature.toLowerCase()));
}

// Helper to check if usage is within plan limits
export function isWithinPlanLimits(
  planId: PlanId,
  usage: {
    projects?: number;
    feedbackThisMonth?: number;
    teamMembers?: number;
    storageGB?: number;
  }
): { allowed: boolean; message?: string } {
  const plan = SUBSCRIPTION_PLANS[planId];
  const limits = plan.limits;

  if (usage.projects !== undefined && limits.projects !== -1 && usage.projects >= limits.projects) {
    return {
      allowed: false,
      message: `You've reached the limit of ${limits.projects} project${
        limits.projects > 1 ? 's' : ''
      } for the ${plan.name} plan.`,
    };
  }

  if (
    usage.feedbackThisMonth !== undefined &&
    limits.feedbackPerMonth !== -1 &&
    usage.feedbackThisMonth >= limits.feedbackPerMonth
  ) {
    return {
      allowed: false,
      message: `You've reached the limit of ${limits.feedbackPerMonth.toLocaleString()} feedback submissions this month for the ${
        plan.name
      } plan.`,
    };
  }

  if (
    usage.teamMembers !== undefined &&
    limits.teamMembers !== -1 &&
    usage.teamMembers >= limits.teamMembers
  ) {
    return {
      allowed: false,
      message: `You've reached the limit of ${limits.teamMembers} team members for the ${plan.name} plan.`,
    };
  }

  if (
    usage.storageGB !== undefined &&
    limits.storageGB !== -1 &&
    usage.storageGB >= limits.storageGB
  ) {
    return {
      allowed: false,
      message: `You've reached the storage limit of ${limits.storageGB}GB for the ${plan.name} plan.`,
    };
  }

  return { allowed: true };
}
