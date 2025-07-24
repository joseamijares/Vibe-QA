export const WaveTop = ({
  className = '',
  color = '#ffffff',
}: {
  className?: string;
  color?: string;
}) => (
  <svg
    className={`absolute left-0 w-full ${className}`}
    style={{ bottom: '-1px' }}
    viewBox="0 0 1440 100"
    preserveAspectRatio="none"
  >
    <path d="M0,50 C360,100 720,0 1440,50 L1440,100 L0,100 Z" fill={color} />
  </svg>
);

export const WaveBottom = ({
  className = '',
  color = '#ffffff',
}: {
  className?: string;
  color?: string;
}) => (
  <svg
    className={`absolute left-0 w-full ${className}`}
    style={{ top: '-1px' }}
    viewBox="0 0 1440 100"
    preserveAspectRatio="none"
  >
    <path d="M0,50 C360,0 720,100 1440,50 L1440,0 L0,0 Z" fill={color} />
  </svg>
);

export const CurveTop = ({
  className = '',
  color = '#ffffff',
}: {
  className?: string;
  color?: string;
}) => (
  <svg
    className={`absolute left-0 w-full ${className}`}
    style={{ bottom: '-1px' }}
    viewBox="0 0 1440 100"
    preserveAspectRatio="none"
  >
    <path d="M0,100 Q720,0 1440,100 L1440,100 L0,100 Z" fill={color} />
  </svg>
);

export const DiagonalTop = ({
  className = '',
  color = '#ffffff',
}: {
  className?: string;
  color?: string;
}) => (
  <svg
    className={`absolute left-0 w-full ${className}`}
    style={{ bottom: '-1px' }}
    viewBox="0 0 1440 100"
    preserveAspectRatio="none"
  >
    <path d="M0,100 L1440,0 L1440,100 Z" fill={color} />
  </svg>
);

export const FloatingHexagon = ({ className = '' }: { className?: string }) => (
  <div className={`absolute ${className}`} style={{ width: '200px', height: '200px' }}>
    <svg className="w-full h-full" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#156C8B" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#3387A7" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M100 20 L170 60 L170 140 L100 180 L30 140 L30 60 Z"
        fill="url(#hexGradient)"
        stroke="#156C8B"
        strokeWidth="1"
        strokeOpacity="0.2"
      />
    </svg>
  </div>
);

export const FloatingCircle = ({
  className = '',
  size = 100,
}: {
  className?: string;
  size?: number;
}) => (
  <div className={`absolute ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="circleGradient">
          <stop offset="0%" stopColor="#3387A7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#156C8B" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="url(#circleGradient)" />
    </svg>
  </div>
);

export const GridPattern = ({ className = '' }: { className?: string }) => (
  <svg className={`absolute inset-0 ${className}`} width="100%" height="100%">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#156C8B" strokeWidth="1" opacity="0.1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

export const DotPattern = ({ className = '' }: { className?: string }) => (
  <svg className={`absolute inset-0 ${className}`} width="100%" height="100%">
    <defs>
      <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1.5" fill="#156C8B" opacity="0.1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

export const GradientBlob = ({ className = '' }: { className?: string }) => (
  <div className={`absolute ${className}`} style={{ width: '600px', height: '600px' }}>
    <svg className="w-full h-full" viewBox="0 0 600 600">
      <defs>
        <radialGradient id="blobGradient">
          <stop offset="0%" stopColor="#156C8B" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#3387A7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#66A5BD" stopOpacity="0.1" />
        </radialGradient>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
        </filter>
      </defs>
      <path
        d="M300,100 Q450,200 400,350 T200,400 Q50,300 100,150 T300,100"
        fill="url(#blobGradient)"
        filter="url(#blur)"
      />
    </svg>
  </div>
);

export const NoiseTexture = ({
  className = '',
  opacity = 0.05,
}: {
  className?: string;
  opacity?: number;
}) => (
  <svg className={`absolute inset-0 w-full h-full ${className}`} preserveAspectRatio="none">
    <defs>
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" seed="5" numOctaves="4" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity={opacity} />
    </defs>
    <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity={opacity} />
  </svg>
);

export const GrainTexture = ({ className = '' }: { className?: string }) => (
  <div
    className={`absolute inset-0 ${className} pointer-events-none`}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='grain'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.1'/%3E%3C/svg%3E")`,
      opacity: 0.4,
      mixBlendMode: 'multiply',
    }}
  />
);
