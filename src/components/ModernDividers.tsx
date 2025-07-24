interface ModernDividerProps {
  className?: string;
}

export function WaveDivider({ className = '' }: ModernDividerProps) {
  return (
    <div
      className={`absolute left-0 right-0 w-full h-20 -bottom-1 ${className}`}
      style={{
        background: 'inherit',
        clipPath:
          'polygon(0 20%, 10% 40%, 20% 20%, 30% 35%, 40% 25%, 50% 40%, 60% 30%, 70% 45%, 80% 35%, 90% 50%, 100% 40%, 100% 100%, 0 100%)',
      }}
    />
  );
}

export function SmoothWaveDivider({ className = '' }: ModernDividerProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute left-0 right-0 w-full h-24 -bottom-12"
        style={{
          background: 'inherit',
          clipPath: 'ellipse(150% 100% at 50% 0%)',
        }}
      />
    </div>
  );
}

export function DiagonalDivider({ className = '' }: ModernDividerProps) {
  return (
    <div
      className={`absolute left-0 right-0 w-full h-20 -bottom-1 ${className}`}
      style={{
        background: 'inherit',
        clipPath: 'polygon(0 0, 100% 60%, 100% 100%, 0 100%)',
      }}
    />
  );
}

export function ZigzagDivider({ className = '' }: ModernDividerProps) {
  return (
    <div
      className={`absolute left-0 right-0 w-full h-16 -bottom-1 ${className}`}
      style={{
        background: 'inherit',
        clipPath:
          'polygon(0 0, 5% 50%, 10% 0, 15% 50%, 20% 0, 25% 50%, 30% 0, 35% 50%, 40% 0, 45% 50%, 50% 0, 55% 50%, 60% 0, 65% 50%, 70% 0, 75% 50%, 80% 0, 85% 50%, 90% 0, 95% 50%, 100% 0, 100% 100%, 0 100%)',
      }}
    />
  );
}

export function CurveDivider({ className = '' }: ModernDividerProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute left-0 right-0 w-full h-32 -bottom-16"
        style={{
          background: 'inherit',
          borderRadius: '50% 50% 0 0',
        }}
      />
    </div>
  );
}
