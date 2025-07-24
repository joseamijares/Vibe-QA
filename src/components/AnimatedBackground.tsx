import React from 'react';

interface AnimatedBackgroundProps {
  variant?: 'orbs' | 'gradient' | 'mesh';
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'orbs',
  className = '',
}) => {
  if (variant === 'orbs') {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        <div className="absolute top-20 -left-20 orb orb-1" />
        <div className="absolute bottom-20 -right-20 orb orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 orb orb-3" />
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={`absolute inset-0 ${className}`}>
        <div className="absolute inset-0 gradient-vibe-animated opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
      </div>
    );
  }

  if (variant === 'mesh') {
    return (
      <div className={`absolute inset-0 ${className}`}>
        <div className="absolute inset-0 gradient-vibe-mesh opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/80 to-white" />
      </div>
    );
  }

  return null;
};

export const FloatingElements: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#3387a7]/20 to-[#66a5bd]/20 animate-float" />
      <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB39A]/20 animate-float-delayed" />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-[#094765]/20 to-[#156c8b]/20 animate-float animation-delay-2000" />
      <div className="absolute bottom-1/3 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-[#3387a7]/10 to-[#66a5bd]/10 animate-float-delayed animation-delay-4000" />
    </div>
  );
};

export const DataVisualization: React.FC<{ className?: string }> = ({ className = '' }) => {
  const bars = [
    { height: '60%', delay: '0ms' },
    { height: '80%', delay: '200ms' },
    { height: '40%', delay: '400ms' },
    { height: '90%', delay: '600ms' },
    { height: '70%', delay: '800ms' },
    { height: '50%', delay: '1000ms' },
  ];

  return (
    <div className={`flex items-end gap-2 h-32 ${className}`}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className="flex-1 bg-gradient-to-t from-[#094765] to-[#3387a7] rounded-t-sm data-bar"
          style={{
            height: bar.height,
            animationDelay: bar.delay,
          }}
        />
      ))}
    </div>
  );
};
