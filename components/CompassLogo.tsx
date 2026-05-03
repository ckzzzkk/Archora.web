'use client';

import { useEffect, useState } from 'react';

interface CompassLogoProps {
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const COLORS = {
  letterform: '#C8C8C8',
  compassAccent: '#C8C8C8',
  compassRing: '#9A9590',
};

export default function CompassLogo({ size = 24, showLabel = false, className = '' }: CompassLogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex items-center gap-2 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        className="compass-logo"
        style={{ overflow: 'visible' }}
      >
        <style>{`
          .compass-logo {
            animation: compassEntrance 0.6s ease-out forwards;
          }
          @keyframes compassEntrance {
            from { transform: scale(0.85) rotate(-10deg); opacity: 0; }
            to { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          .compass-north-pulse {
            animation: northPulse 3s ease-in-out infinite;
          }
          @keyframes northPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.65; }
          }
          .compass-center-dot {
            animation: centerPulse 3s ease-in-out infinite 0.5s;
          }
          @keyframes centerPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>

        {/* Outer ring */}
        <circle cx="30" cy="30" r="28" stroke="#333333" strokeWidth="1" opacity="0.6" />
        <circle cx="30" cy="30" r="22" stroke={COLORS.compassRing} strokeWidth="1" opacity="0.5" />

        {/* Layered A — faint background */}
        <g opacity="0.15">
          <path d="M30,6 C34,12 38,22 40,30 C42,38 43,42 44,46" stroke={COLORS.compassRing} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M30,6 C26,12 22,22 20,30 C18,38 17,42 16,46" stroke={COLORS.compassRing} strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>

        {/* Main Wave A — left stroke */}
        <path
          d="M30,5 C34.5,11 38.5,21 40.5,29 C42.5,37 43.5,41 44.5,45"
          stroke={COLORS.letterform}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
          className="compass-north-pulse"
        />
        {/* Main Wave A — right stroke */}
        <path
          d="M30,5 C25.5,11 21.5,21 19.5,29 C17.5,37 16.5,41 15.5,45"
          stroke={COLORS.letterform}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
          className="compass-north-pulse"
        />
        {/* Crossbar */}
        <line x1="22" y1="26" x2="38" y2="26" stroke={COLORS.letterform} strokeWidth="4" strokeLinecap="round" />

        {/* Compass star */}
        <line x1="30" y1="20" x2="30" y2="40" stroke={COLORS.compassRing} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="20" y1="30" x2="40" y2="30" stroke={COLORS.compassRing} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

        {/* Compass inner ring */}
        <circle cx="30" cy="30" r="8" stroke={COLORS.compassRing} strokeWidth="1" fill="none" opacity="0.5" />

        {/* Center dot */}
        <circle cx="30" cy="30" r="2.5" fill={COLORS.compassAccent} className="compass-center-dot" opacity="0.9" />

        {/* N label */}
        <text x="27.5" y="3" fontFamily="monospace" fontSize="4.5" fill={COLORS.compassRing} opacity="0.7">N</text>
      </svg>

      {showLabel && (
        <span className="font-heading text-2xl text-primary tracking-wide hover:text-accent transition-colors">
          ASORIA
        </span>
      )}
    </div>
  );
}
