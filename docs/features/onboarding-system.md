# Onboarding System

The VibeQA onboarding system provides a step-by-step guide for new users to set up their organization, create their first project, and learn how to integrate the feedback widget.

## Overview

The onboarding flow is automatically displayed to new users who:
- Have just registered for an account
- Don't have an organization yet
- Haven't completed the onboarding process

## Components

### Core Components

1. **OnboardingModal** (`/src/components/onboarding/OnboardingModal.tsx`)
   - Main container for the onboarding flow
   - Manages step navigation and progress tracking
   - Handles skip and completion actions

2. **useOnboarding Hook** (`/src/hooks/useOnboarding.ts`)
   - Manages onboarding state and persistence
   - Tracks completion status in localStorage and user metadata
   - Provides methods to control the onboarding flow

### Step Components

1. **WelcomeStep** - Introduction to VibeQA features
2. **OrganizationStep** - Create the user's organization
3. **ProjectStep** - Create the first project
4. **WidgetStep** - Display widget integration code
5. **TeamStep** - Optional team member invitations
6. **CompletionStep** - Summary and next steps

## State Management

The onboarding state is persisted in two places:
- **localStorage**: For quick access and step tracking
- **User metadata**: For permanent completion status

Keys used:
- `vibeqa_onboarding_completed_{userId}` - Completion status
- `vibeqa_onboarding_step_{userId}` - Current step position

## Features

### Progress Tracking
- Visual progress bar showing completion percentage
- Step indicators with icons
- Ability to navigate back to previous steps

### Skip Functionality
- Users can skip the entire onboarding at any time
- Confirmation dialog prevents accidental skips
- Can be restarted from Settings page

### Organization Creation
- Automatic slug generation
- Trial status initialization
- Immediate organization context update

### Smart Navigation
- Conditional step display based on previous actions
- Skip options for optional steps
- Automatic reload after organization creation

## Usage

The onboarding modal is automatically included in the `DashboardLayout` and will display when conditions are met.

### Programmatic Control

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';

function MyComponent() {
  const {
    showOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  } = useOnboarding();

  // Start onboarding manually
  const handleStartTour = () => {
    startOnboarding();
  };

  // Reset for testing
  const handleReset = () => {
    resetOnboarding();
  };
}
```

## Styling

The onboarding modal uses:
- Glassmorphism effects for the modal backdrop
- Brand gradient colors for headers
- Smooth animations for step transitions
- Custom `bounce-gentle` animation for completion

## Best Practices

1. **Keep steps focused** - Each step should have a single, clear purpose
2. **Provide context** - Explain why each step is important
3. **Allow flexibility** - Let users skip optional steps
4. **Save progress** - Users can close and resume later
5. **Test thoroughly** - Ensure all paths work correctly

## Future Enhancements

- [ ] Add tutorial videos for complex features
- [ ] Implement interactive widget preview
- [ ] Add more customization options
- [ ] Create tooltips for specific dashboard features
- [ ] Add analytics to track completion rates