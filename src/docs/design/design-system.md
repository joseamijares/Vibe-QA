# VibeQA Design System

This design system serves as the single source of truth for VibeQA's visual language, ensuring consistency across all interfaces and touchpoints.

## Core Principles

1. **Modern & Clean**: Embrace whitespace, use subtle effects, avoid clutter
2. **Depth Through Layers**: Use glassmorphism, shadows, and overlapping elements
3. **Smooth Interactions**: Every interaction should feel fluid and responsive
4. **Visual Hierarchy**: Clear distinction between primary, secondary, and tertiary elements

## Color Palette

### Primary Colors (Blues)
```css
--vibe-dark: #094765;        /* Deep ocean blue - primary brand color */
--vibe-medium: #156c8b;      /* Medium blue - secondary actions */
--vibe-dark-accent: #002c45; /* Darker blue - emphasis */
--vibe-teal: #0a5878;        /* Teal accent - special elements */
--vibe-light: #3f90b3;       /* Light blue - hover states */
--vibe-pale: #a3cddd;        /* Pale blue - backgrounds */
```

### Accent Colors
```css
--vibe-accent: #ff6b35;       /* Coral orange - CTAs, important actions */
--vibe-accent-hover: #e85d2f; /* Darker coral - hover state */
--vibe-accent-light: #ffb39a; /* Light coral - subtle accents */
```

### Neutral Colors
```css
/* Grays - from darkest to lightest */
--gray-900: #111827;
--gray-800: #1f2937;
--gray-700: #374151;
--gray-600: #4b5563;
--gray-500: #6b7280;
--gray-400: #9ca3af;
--gray-300: #d1d5db;
--gray-200: #e5e7eb;
--gray-100: #f3f4f6;
--gray-50: #f9fafb;
```

### Semantic Colors
```css
--success: #10b981;    /* Green - success states */
--warning: #f59e0b;    /* Yellow - warnings */
--error: #ef4444;      /* Red - errors */
--info: #3b82f6;       /* Blue - information */
```

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale
```css
/* Headings */
.text-7xl { font-size: 4.5rem; line-height: 1; }      /* Hero titles */
.text-6xl { font-size: 3.75rem; line-height: 1; }     /* Page titles */
.text-5xl { font-size: 3rem; line-height: 1; }        /* Section titles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; } /* Subsection titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }

/* Body */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* Large body */
.text-base { font-size: 1rem; line-height: 1.5rem; }    /* Default body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* Small text */
.text-xs { font-size: 0.75rem; line-height: 1rem; }     /* Tiny text */
```

### Font Weights
```css
.font-normal { font-weight: 400; }   /* Body text */
.font-medium { font-weight: 500; }   /* Slightly emphasized */
.font-semibold { font-weight: 600; } /* Subheadings */
.font-bold { font-weight: 700; }     /* Headings, CTAs */
```

## Spacing System

Based on 4px grid system:
```css
/* Spacing scale */
.space-0: 0;
.space-1: 0.25rem;  /* 4px */
.space-2: 0.5rem;   /* 8px */
.space-3: 0.75rem;  /* 12px */
.space-4: 1rem;     /* 16px */
.space-6: 1.5rem;   /* 24px */
.space-8: 2rem;     /* 32px */
.space-10: 2.5rem;  /* 40px */
.space-12: 3rem;    /* 48px */
.space-16: 4rem;    /* 64px */
.space-20: 5rem;    /* 80px */
.space-24: 6rem;    /* 96px */
```

## Border Radius

```css
.rounded-none: 0;
.rounded-sm: 0.125rem;    /* 2px - subtle rounding */
.rounded: 0.25rem;        /* 4px - small elements */
.rounded-md: 0.375rem;    /* 6px - default */
.rounded-lg: 0.5rem;      /* 8px - cards */
.rounded-xl: 0.75rem;     /* 12px - larger cards */
.rounded-2xl: 1rem;       /* 16px - feature cards */
.rounded-3xl: 1.5rem;     /* 24px - hero elements */
.rounded-full: 9999px;    /* Pills, circles */
```

## Shadows

```css
/* Elevation scale */
.shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
.shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
.shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
.shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
.shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
.shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Colored shadows for CTAs */
.shadow-accent: 0 10px 30px rgba(255, 107, 53, 0.3);
.shadow-primary: 0 10px 30px rgba(9, 71, 101, 0.3);
```

## Z-Index Scale

```css
.z-0: 0;        /* Base level */
.z-10: 10;      /* Floating elements */
.z-20: 20;      /* Dropdowns */
.z-30: 30;      /* Fixed headers */
.z-40: 40;      /* Modals backdrop */
.z-50: 50;      /* Modals, tooltips */
.z-max: 9999;   /* Critical UI elements */
```

## Breakpoints

```css
/* Mobile-first responsive design */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

## Motion & Transitions

### Timing Functions
```css
.ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
.ease-out: cubic-bezier(0, 0, 0.2, 1);
.ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Duration Scale
```css
.duration-75: 75ms;    /* Micro-interactions */
.duration-100: 100ms;  /* Quick transitions */
.duration-150: 150ms;  /* Default hover */
.duration-200: 200ms;  /* Standard transitions */
.duration-300: 300ms;  /* Smooth transitions */
.duration-500: 500ms;  /* Deliberate animations */
.duration-700: 700ms;  /* Page transitions */
.duration-1000: 1000ms; /* Slow reveals */
```

## Gradient System

### Linear Gradients
```css
/* Hero gradient */
.gradient-hero {
  background: linear-gradient(135deg, #094765 0%, #156c8b 100%);
}

/* Text gradients */
.gradient-text-modern {
  background: linear-gradient(135deg, #094765 0%, #3387a7 50%, #66a5bd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gradient-text-accent {
  background: linear-gradient(135deg, #ff6b35 0%, #ffb39a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Mesh Gradients
Used for subtle backgrounds and depth effects.

## Layout Principles

### Container Widths
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-sm { max-width: 640px; }
.container-md { max-width: 768px; }
.container-lg { max-width: 1024px; }
.container-xl { max-width: 1280px; }
```

### Section Spacing
```css
/* Vertical rhythm */
.section-padding { 
  padding-top: 6rem;    /* 96px */
  padding-bottom: 6rem; /* 96px */
}

@media (max-width: 768px) {
  .section-padding {
    padding-top: 4rem;    /* 64px */
    padding-bottom: 4rem; /* 64px */
  }
}
```

## Accessibility

### Focus States
All interactive elements must have visible focus states:
```css
:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### Color Contrast
- Normal text: 4.5:1 minimum contrast ratio
- Large text: 3:1 minimum contrast ratio
- Interactive elements: 3:1 minimum contrast ratio

### Motion Preferences
Respect user's motion preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```