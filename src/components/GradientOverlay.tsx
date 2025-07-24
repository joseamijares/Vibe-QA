interface GradientOverlayProps {
  type?: 'diagonal' | 'horizontal' | 'vertical' | 'angular';
  colors?: 'ocean' | 'sky' | 'teal' | 'mist' | 'sunset' | 'coral' | 'mint' | 'warm';
  opacity?: number;
  className?: string;
  animate?: boolean;
}

export function GradientOverlay({
  type = 'diagonal',
  colors = 'ocean',
  opacity = 0.1,
  className = '',
  animate = false,
}: GradientOverlayProps) {
  const getGradientClass = () => {
    const colorMap = {
      ocean: 'gradient-deep-ocean',
      sky: 'gradient-sky-fade',
      teal: 'gradient-teal-wave',
      mist: 'gradient-light-mist',
      sunset: 'gradient-sunset-vibe',
      coral: 'gradient-coral-accent',
      mint: 'gradient-mint-accent',
      warm: 'gradient-warm-accent',
    };

    return animate ? 'gradient-vibe-animated' : colorMap[colors];
  };

  const getTransform = () => {
    switch (type) {
      case 'horizontal':
        return 'scaleY(0.5)';
      case 'vertical':
        return 'scaleX(0.5)';
      case 'angular':
        return 'rotate(-45deg) scale(1.5)';
      default:
        return '';
    }
  };

  return (
    <div
      className={`absolute inset-0 ${getGradientClass()} ${className}`}
      style={{
        opacity,
        transform: getTransform(),
        transformOrigin: 'center',
      }}
    />
  );
}

export function GradientStripe({
  position = 'top',
  height = '200px',
  colors = 'ocean',
  opacity = 0.15,
}: {
  position?: 'top' | 'bottom' | 'left' | 'right';
  height?: string;
  colors?: 'ocean' | 'sky' | 'teal' | 'mist';
  opacity?: number;
}) {
  const positionStyles = {
    top: { top: 0, left: 0, right: 0, height },
    bottom: { bottom: 0, left: 0, right: 0, height },
    left: { top: 0, left: 0, bottom: 0, width: height },
    right: { top: 0, right: 0, bottom: 0, width: height },
  };

  const colorMap = {
    ocean: 'gradient-deep-ocean',
    sky: 'gradient-sky-fade',
    teal: 'gradient-teal-wave',
    mist: 'gradient-light-mist',
  };

  return (
    <div
      className={`absolute ${colorMap[colors]}`}
      style={{
        ...positionStyles[position],
        opacity,
      }}
    />
  );
}
