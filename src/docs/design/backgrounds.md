# Background System Guide

VibeQA uses a sophisticated background system that creates visual rhythm and hierarchy throughout the application.

## Background Variants

### 1. Aurora (Dark)
Dramatic, flowing aurora borealis effect with deep colors.

**Characteristics:**
- Base: Dark gradient (slate-900 to slate-800)
- Aurora layers: Blue, purple, and green flowing gradients
- High contrast for white text
- Creates premium, sophisticated feel

**CSS Implementation:**
```css
/* Base gradient */
background: linear-gradient(to bottom, #0f172a, #1e293b, #0f172a);

/* Aurora layers */
.aurora-1 {
  background: radial-gradient(ellipse at center, 
    rgba(59, 130, 246, 0.5) 0%,
    rgba(147, 51, 234, 0.3) 25%,
    rgba(16, 185, 129, 0.2) 50%,
    transparent 70%);
}
```

**Usage:**
- Hero sections
- Testimonial sections
- Final CTA sections
- Premium feature highlights

**Component usage:**
```jsx
<AnimatedBackground variant="aurora" />
```

### 2. Aurora Light
Subtle, ethereal aurora effect on light backgrounds.

**Characteristics:**
- Base: Light gradient (white to gray-50)
- Aurora layers: Very soft pastels (5-25% opacity)
- Low contrast for elegant feel
- Adds depth without overwhelming

**CSS Implementation:**
```css
/* Base gradient */
background: linear-gradient(to bottom-right, #f9fafb, #ffffff, #f9fafb);

/* Light aurora layers */
.aurora-light-1 {
  background: radial-gradient(ellipse at center,
    rgba(59, 130, 246, 0.25) 0%,
    rgba(147, 51, 234, 0.15) 25%,
    rgba(16, 185, 129, 0.1) 50%,
    transparent 70%);
}
```

**Usage:**
- Feature sections
- Pricing sections
- How it works sections
- Trust/security sections

**Component usage:**
```jsx
<AnimatedBackground variant="aurora-light" />
```

### 3. Aurora Medium (Footer)
Lighter aurora variant with unique positioning.

**Characteristics:**
- Base: Medium gradient (slate-300 to slate-200)
- Aurora positioning: Corner-based instead of centered
- Unique animation pattern to avoid repetition
- Bridge between light and dark sections

**CSS Implementation:**
```css
/* Base gradient */
background: linear-gradient(to bottom-right, #cbd5e1, #e2e8f0, #cbd5e1);

/* Footer-specific aurora positioning */
.aurora-footer-1 {
  position: absolute;
  bottom: -200px;
  left: -200px;
  /* Flows from bottom-left corner */
}
```

**Usage:**
- Footer section only
- Transitional areas

**Component usage:**
```jsx
<AnimatedBackground variant="aurora-medium" />
```

### 4. Gradient (Legacy)
Simple animated gradient for subtle movement.

**Characteristics:**
- Linear gradient animation
- Subtle color shifts
- Minimal performance impact

**Usage:**
- Loading states
- Temporary sections
- Fallback option

### 5. Orbs (Legacy)
Floating circular gradients.

**Characteristics:**
- Individual floating elements
- Blur effects
- Random positioning

**Usage:**
- Being phased out in favor of aurora effects

## Section Flow Pattern

The landing page follows a deliberate pattern of alternating backgrounds:

```
1. Hero Section          → Aurora (Dark)     [High Drama]
2. How It Works         → Aurora Light      [Clean/Educational]
3. Features             → Aurora Light      [Clean/Educational]
4. Product Showcase     → Gradient Dark     [Focus]
5. Testimonials         → Aurora (Dark)     [High Drama]
6. Pricing              → Aurora Light      [Clean/Business]
7. Trust & Security     → Aurora Light      [Clean/Professional]
8. Final CTA            → Aurora (Dark)     [High Drama]
9. Footer               → Aurora Medium     [Transitional]
```

This creates a visual rhythm: **Drama → Clean → Drama → Clean → Drama**

## Implementation Guidelines

### 1. Background Stacking
Always ensure proper z-index layering:

```jsx
<section className="relative">
  <AnimatedBackground variant="aurora" />  {/* z-index: auto */}
  <div className="relative z-10">          {/* z-index: 10 */}
    <!-- Content goes here -->
  </div>
</section>
```

### 2. Performance Considerations
- Use CSS transforms for animations (GPU accelerated)
- Limit the number of animated layers
- Consider `will-change` for frequently animated elements
- Test on lower-end devices

### 3. Accessibility
- Ensure sufficient contrast ratios
- Provide `prefers-reduced-motion` alternatives
- Test with screen readers

### 4. Color Combinations

**For Aurora (Dark):**
- Primary text: `text-white`
- Secondary text: `text-gray-200` or `text-gray-300`
- Accent elements: Use glassmorphism or light colors

**For Aurora Light:**
- Primary text: `text-gray-900`
- Secondary text: `text-gray-600`
- Accent elements: Use brand colors

## Animation Patterns

### Aurora Flow Animation
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
```

### Aurora Shift Animation
```css
@keyframes aurora-shift {
  0%, 100% {
    opacity: 0.3;
    filter: hue-rotate(0deg) blur(60px);
  }
  50% {
    opacity: 0.4;
    filter: hue-rotate(-20deg) blur(70px);
  }
}
```

## Responsive Behavior

### Mobile Optimizations
- Reduce animation complexity on mobile
- Decrease blur radius for better performance
- Consider static gradients for very low-end devices

```css
@media (max-width: 768px) {
  .aurora-layer {
    filter: blur(40px); /* Reduced from 60px */
  }
}

@media (prefers-reduced-motion: reduce) {
  .aurora-layer {
    animation: none;
  }
}
```

## Creating New Background Variants

When creating new background variants:

1. **Define the use case**: What mood/purpose?
2. **Choose base colors**: Light or dark foundation?
3. **Design movement**: Subtle or dramatic?
4. **Test contrast**: Ensure readability
5. **Optimize performance**: Profile animations

Example template:
```typescript
if (variant === 'your-variant') {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-color1 to-color2">
        <div className="your-animation-layer-1" />
        <div className="your-animation-layer-2" />
      </div>
    </div>
  );
}
```

## Best Practices

1. **Consistency**: Use the same background variant for similar content types
2. **Contrast**: Always test text readability on backgrounds
3. **Performance**: Monitor FPS during animations
4. **Subtlety**: Less is often more - avoid overwhelming users
5. **Purpose**: Each background should enhance, not distract from content