# Component Patterns Guide

This guide documents the reusable component patterns that define VibeQA's visual identity.

## Glassmorphism Effects

### Light Glassmorphism

Used on light backgrounds for subtle depth and elegance.

```css
.glass-modern-light {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(200%);
  -webkit-backdrop-filter: blur(10px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.05);
}
```

**Use cases:**

- Navigation header
- Feature cards on white backgrounds
- Footer container
- Form containers

### Dark Glassmorphism

Used on dark backgrounds for dramatic effect.

```css
.glass-modern {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px) saturate(200%);
  -webkit-backdrop-filter: blur(10px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.1);
}
```

**Use cases:**

- Cards on dark sections
- Testimonial cards on aurora backgrounds
- Modal overlays
- Floating stats cards

### Enhanced Glassmorphism (Testimonials)

Special variant with stronger blur and subtle top highlight.

```css
.glass-testimonial {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.glass-testimonial::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 100%
  );
}
```

## Button Styles

### Primary Button (Magnetic Effect)

The main CTA button with magnetic hover effect and ripple animation.

```css
.magnetic-button {
  position: relative;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #ff6b35 0%, #e85d2f 100%);
  color: white;
  font-weight: 600;
  overflow: hidden;
}

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
  transition:
    width 0.6s,
    height 0.6s;
}

.magnetic-button:hover::before {
  width: 300px;
  height: 300px;
}

.magnetic-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
}
```

**Variants:**

- `size="lg"`: Large CTAs (hero, final CTA)
- `size="md"`: Default size
- `size="sm"`: Inline actions

### Secondary Button

Outline style for secondary actions.

```css
.button-outline {
  background: transparent;
  border: 1px solid currentColor;
  transition: all 0.2s ease;
}

.button-outline:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: currentColor;
  transform: translateY(-1px);
}
```

### Ghost Button

Minimal style for tertiary actions.

```css
.button-ghost {
  background: transparent;
  border: none;
  transition: all 0.2s ease;
}

.button-ghost:hover {
  background: rgba(0, 0, 0, 0.05);
}
```

## Card Patterns

### Modern Card

The standard card with hover effects and gradient border on hover.

```css
.card-modern {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.card-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #094765, #3387a7, #ff6b35);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.card-modern:hover::before {
  transform: translateX(0);
}

.card-modern:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.1);
}
```

### Feature Card

Card with icon and gradient shadow effect.

```html
<div className="group">
  <div className="relative">
    <div
      className="absolute -inset-1 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-lg"
    ></div>
    <div
      className="relative glass-modern-light rounded-2xl p-8 h-full space-y-4 hover:shadow-2xl transition-all duration-300"
    >
      <!-- Content -->
    </div>
  </div>
</div>
```

### Pricing Card

Special styling for pricing tiers.

```css
.pricing-recommended {
  position: relative;
  border: 2px solid #ff6b35;
  transform: scale(1.05);
}

.pricing-recommended::before {
  content: 'RECOMMENDED';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff6b35;
  color: white;
  padding: 4px 16px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}
```

## Badge Patterns

### Default Badge

Small inline labels for status and categories.

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid;
}
```

**Variants:**

- Success: `bg-green-100 text-green-700 border-green-200`
- Warning: `bg-yellow-100 text-yellow-700 border-yellow-200`
- Error: `bg-red-100 text-red-700 border-red-200`
- Info: `bg-blue-100 text-blue-700 border-blue-200`

### Accent Badge

For highlighting special content.

```css
.badge-accent {
  background: rgba(255, 107, 53, 0.1);
  color: #ff6b35;
  border: 1px solid rgba(255, 107, 53, 0.2);
}
```

## Navigation Patterns

### Glass Navigation

The main header navigation with glassmorphism.

```css
.nav-glass {
  position: fixed;
  top: 1rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem 2rem;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.05);
}
```

### Nav Link Hover

Smooth transitions for navigation items.

```css
.nav-link {
  position: relative;
  color: #4b5563;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #111827;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: #ff6b35;
  transition: width 0.2s ease;
}

.nav-link:hover::after {
  width: 100%;
}
```

## Form Elements

### Input Fields

Modern input styling with focus states.

```css
.input-modern {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.input-modern:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-modern:hover {
  border-color: #d1d5db;
}
```

### Form Container

Glass container for forms.

```css
.form-container {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.05);
}
```

## Icon Patterns

### Icon Container

Consistent icon presentation.

```css
.icon-container {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

/* Primary gradient */
.icon-container-primary {
  background: linear-gradient(135deg, #094765, #3387a7);
}

/* Accent gradient */
.icon-container-accent {
  background: linear-gradient(135deg, #ff6b35, #ffb39a);
}

/* Glass variant */
.icon-container-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## Loading States

### Skeleton Loader

For content that's loading.

```css
.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### Spinner

Simple loading spinner.

```css
.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## Hover Effects

### Scale on Hover

Subtle scale effect for interactive elements.

```css
.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}
```

### Glow on Hover

Soft glow effect for important elements.

```css
.hover-glow {
  transition: all 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
}
```

### Lift on Hover

Card lift effect.

```css
.hover-lift {
  transition: all 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}
```

## Best Practices

1. **Consistency**: Always use predefined component patterns
2. **Accessibility**: Ensure all interactive elements have proper focus states
3. **Performance**: Use `will-change` sparingly for animations
4. **Responsive**: Test all components on mobile devices
5. **Dark Mode**: Consider how glassmorphism effects work on both light and dark backgrounds
