import { CSSProperties } from 'react';

export type DividerType = 'wave' | 'wave-inverted' | 'curve' | 'diagonal' | 'zigzag';

interface SectionDividerProps {
  type?: DividerType;
  color?: string;
  className?: string;
  flip?: boolean;
}

export function SectionDivider({
  type = 'wave',
  color = '#ffffff',
  className = '',
  flip = false,
}: SectionDividerProps) {
  const getSvgPath = () => {
    switch (type) {
      case 'wave':
        return flip
          ? 'M0,0 L0,60 Q360,100 720,60 T1440,60 L1440,0 Z'
          : 'M0,100 L0,40 Q360,0 720,40 T1440,40 L1440,100 Z';
      case 'wave-inverted':
        return flip
          ? 'M0,0 L0,40 Q360,0 720,40 T1440,40 L1440,0 Z'
          : 'M0,100 L0,60 Q360,100 720,60 T1440,60 L1440,100 Z';
      case 'curve':
        return flip
          ? 'M0,0 L0,100 Q720,0 1440,100 L1440,0 Z'
          : 'M0,100 L0,0 Q720,100 1440,0 L1440,100 Z';
      case 'diagonal':
        return flip ? 'M0,0 L0,100 L1440,0 Z' : 'M0,100 L0,0 L1440,100 L1440,100 Z';
      case 'zigzag':
        return flip
          ? 'M0,0 L0,50 L240,100 L480,50 L720,100 L960,50 L1200,100 L1440,50 L1440,0 Z'
          : 'M0,100 L0,50 L240,0 L480,50 L720,0 L960,50 L1200,0 L1440,50 L1440,100 Z';
      default:
        return '';
    }
  };

  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    overflow: 'hidden',
    lineHeight: 0,
    ...(flip
      ? { top: 0, transform: 'translateY(-99%)' }
      : { bottom: 0, transform: 'translateY(99%)' }),
  };

  return (
    <div className={className} style={style}>
      <svg
        width="100%"
        height="100"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <path d={getSvgPath()} fill={color} />
      </svg>
    </div>
  );
}

// Modern clip-path based dividers
export function ClipPathDivider({
  type = 'wave',
  className = '',
}: {
  type?: 'wave' | 'diagonal' | 'curve';
  className?: string;
}) {
  const getClipPath = () => {
    switch (type) {
      case 'wave':
        return 'polygon(0 0, 100% 0, 100% 65%, 75% 100%, 50% 65%, 25% 100%, 0 65%)';
      case 'diagonal':
        return 'polygon(0 0, 100% 0, 100% 100%, 0 70%)';
      case 'curve':
        return 'ellipse(100% 60% at 50% 0)';
      default:
        return '';
    }
  };

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        clipPath: getClipPath(),
      }}
    />
  );
}
