# Animation Guide

Animations in VibeQA are designed to enhance user experience through smooth, purposeful motion that guides attention and provides feedback.

## Core Animation Principles

1. **Purpose**: Every animation should have a clear purpose
2. **Performance**: Prioritize 60fps smooth animations
3. **Subtlety**: Less is more - avoid overwhelming users
4. **Consistency**: Use the same timing functions across similar interactions
5. **Accessibility**: Always respect `prefers-reduced-motion`

## Timing Functions

### Standard Easings
```css
/* Default - Most interactions */
.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

/* Smooth in-out - Page transitions */
.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Quick start - Exits/dismissals */
.ease-in {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}

/* Linear - Progress indicators */
.ease-linear {
  transition-timing-function: linear;
}
```

### Custom Easings
```css
/* Magnetic button effect */
.ease-magnetic {
  transition-timing-function: cubic-bezier(0.17, 0.55, 0.55, 1);
}

/* Bounce effect */
.ease-bounce {
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## Duration Scale

```css
/* Micro-interactions (hover states) */
.duration-75: 75ms;
.duration-100: 100ms;
.duration-150: 150ms;

/* Standard transitions */
.duration-200: 200ms;  /* Default */
.duration-300: 300ms;  /* Smooth */

/* Deliberate animations */
.duration-500: 500ms;  /* Modals, drawers */
.duration-700: 700ms;  /* Page transitions */
.duration-1000: 1000ms; /* Hero animations */

/* Background animations */
.duration-20s: 20000ms; /* Aurora flow */
.duration-30s: 30000ms; /* Aurora shift */
```

## Common Animation Patterns

### 1. Hover Lift
Subtle elevation change on hover.

```css
.hover-lift {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}
```

### 2. Scale on Hover
Gentle scale for interactive elements.

```css
.hover-scale {
  transition: transform 0.2s ease-out;
}

.hover-scale:hover {
  transform: scale(1.05);
}
```

### 3. Fade In Up
Content reveal animation.

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}
```

### 4. Slide In
Horizontal entrance animation.

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-in {
  animation: slideIn 0.4s ease-out;
}
```

## Complex Animations

### Magnetic Button Effect
Multi-layered hover animation with ripple.

```css
.magnetic-button {
  position: relative;
  transition: all 0.2s ease;
  overflow: hidden;
}

/* Ripple effect */
.magnetic-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease-out, height 0.6s ease-out;
}

.magnetic-button:hover::before {
  width: 300px;
  height: 300px;
}

/* Lift effect */
.magnetic-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
}
```

### Aurora Flow Animation
Smooth, organic movement for background effects.

```css
@keyframes aurora-flow {
  0%, 100% {
    transform: translateX(-50%) translateY(0) scaleX(1);
  }
  25% {
    transform: translateX(-30%) translateY(-20px) scaleX(1.2);
  }
  50% {
    transform: translateX(-70%) translateY(10px) scaleX(0.9);
  }
  75% {
    transform: translateX(-40%) translateY(-10px) scaleX(1.1);
  }
}

/* Usage */
.aurora-layer {
  animation: aurora-flow 30s ease-in-out infinite;
}
```

### Parallax Scrolling
Depth effect through different scroll speeds.

```css
.parallax-slow {
  transition: transform 0.8s cubic-bezier(0.17, 0.55, 0.55, 1);
}

.parallax-medium {
  transition: transform 0.6s cubic-bezier(0.17, 0.55, 0.55, 1);
}

.parallax-fast {
  transition: transform 0.4s cubic-bezier(0.17, 0.55, 0.55, 1);
}

/* JavaScript implementation */
// transform: `translateY(${scrollY * 0.1}px)` // Slow
// transform: `translateY(${scrollY * 0.15}px)` // Medium
// transform: `translateY(${scrollY * 0.2}px)` // Fast
```

### Reveal on Scroll
Staggered content reveal.

```css
.reveal-up {
  opacity: 0;
  animation: reveal-up 0.8s ease-out forwards;
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger children */
.reveal-up:nth-child(1) { animation-delay: 0s; }
.reveal-up:nth-child(2) { animation-delay: 0.1s; }
.reveal-up:nth-child(3) { animation-delay: 0.2s; }
```

## Loading Animations

### Skeleton Loading
Content placeholder animation.

```css
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f3f4f6 25%,
    #e5e7eb 50%,
    #f3f4f6 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}
```

### Pulse Loading
Subtle breathing effect.

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## Micro-interactions

### Button Press
Tactile feedback on click.

```css
.button:active {
  transform: scale(0.98);
  transition: transform 0.1s ease-out;
}
```

### Input Focus
Smooth focus ring expansion.

```css
.input {
  transition: box-shadow 0.2s ease-out;
}

.input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Link Underline
Animated underline on hover.

```css
.link {
  position: relative;
}

.link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.2s ease-out;
}

.link:hover::after {
  width: 100%;
}
```

## Performance Optimization

### Use Transform and Opacity
These properties are GPU-accelerated.

```css
/* Good - GPU accelerated */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* Avoid - Triggers layout */
.element {
  left: 100px;
  width: 200px;
}
```

### Will-change
Use sparingly for frequently animated elements.

```css
.aurora-layer {
  will-change: transform, opacity;
}

/* Remove after animation */
.element {
  will-change: auto;
}
```

### RequestAnimationFrame
For JavaScript animations, always use RAF.

```javascript
function animate() {
  requestAnimationFrame(() => {
    // Animation logic
    element.style.transform = `translateY(${value}px)`;
  });
}
```

## Accessibility

### Reduced Motion
Always provide alternatives for users who prefer reduced motion.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep essential animations but make them instant */
  .aurora-layer {
    opacity: 0.3;
    animation: none;
  }
}
```

### Focus Indicators
Never remove focus indicators, enhance them.

```css
.button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

## Animation Checklist

Before implementing an animation:

- [ ] Does it have a clear purpose?
- [ ] Is it under 60fps on average devices?
- [ ] Does it respect prefers-reduced-motion?
- [ ] Is the timing appropriate for the action?
- [ ] Does it enhance rather than distract?
- [ ] Is it consistent with similar animations?
- [ ] Have you tested on mobile devices?

## Common Pitfalls to Avoid

1. **Over-animating**: Too many simultaneous animations
2. **Wrong timing**: Using ease-in for entrances (use ease-out)
3. **Layout thrashing**: Animating properties that trigger reflow
4. **Infinite loops**: Without purpose or way to stop
5. **Blocking interactions**: Animations that prevent user actions
6. **Ignoring performance**: Not testing on lower-end devices