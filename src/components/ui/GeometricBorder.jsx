import React from 'react';

export const GeometricBorder = ({ side = 'left', opacity = 0.15 }) => {
  const pSize = 160;

  // Fade out towards the center
  const maskStyle = side === 'left'
    ? { WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)', maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' }
    : { WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)', maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        [side]: 0,
        width: '35vw',
        maxWidth: '500px',
        minWidth: '200px',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: opacity,
        color: 'rgb(var(--brand-primary))', // Using the current theme color!
        overflow: 'hidden',
        ...maskStyle
      }}
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern id={`geo-pattern-${side}`} x="0" y="0" width={pSize} height={pSize} patternUnits="userSpaceOnUse">
            <g fill="currentColor">
              {/* Row 1, Col 1 (0,0 to 80,80) */}
              <path d="M 0 0 L 80 0 L 80 80 A 80 80 0 0 1 0 0 Z" opacity="0.15" />
              <path d="M 0 0 L 0 80 A 80 80 0 0 0 80 0 Z" opacity="0.3" />
              <circle cx="25" cy="25" r="10" opacity="0.8" />

              {/* Row 1, Col 2 (80,0 to 160,80) */}
              <path d="M 80 0 L 160 0 L 160 80 A 80 80 0 0 1 80 0 Z" opacity="0.2" />
              {/* Single petal */}
              <path d="M 120 40 Q 140 20 160 40 Q 140 60 120 40 Z" opacity="0.5" />
              
              {/* Row 2, Col 1 (0,80 to 80,160) */}
              <circle cx="40" cy="120" r="40" opacity="0.1" />
              <circle cx="40" cy="120" r="20" opacity="0.4" />
              <circle cx="40" cy="120" r="8" opacity="0.9" />
              
              {/* Row 2, Col 2 (80,80 to 160,160) */}
              <path d="M 120 120 Q 140 100 160 120 Q 140 140 120 120 Z" opacity="0.3" />
              <path d="M 120 120 Q 100 140 80 120 Q 100 100 120 120 Z" opacity="0.3" />
              <path d="M 120 120 Q 140 140 120 160 Q 100 140 120 120 Z" opacity="0.4" />
              <path d="M 120 120 Q 100 100 120 80 Q 140 100 120 120 Z" opacity="0.4" />
              <circle cx="120" cy="120" r="10" opacity="0.7" />
              
              {/* Accents */}
              <circle cx="160" cy="160" r="15" opacity="0.2" />
              <path d="M 0 160 L 40 160 A 40 40 0 0 0 0 120 Z" opacity="0.3" />
            </g>
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill={`url(#geo-pattern-${side})`} />
      </svg>
    </div>
  );
};
