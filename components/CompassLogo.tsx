'use client';

import { useEffect, useState } from 'react';

interface CompassLogoProps {
  size?: number;
  showLabel?: boolean;
  className?: string;
}

// Colors from logo-01-shadow-wave.svg (flipped vertically)
const COLORS = {
  background: '#2A2A28',
  letterformLight: '#C5D4B8',
  letterformDim: '#89B4C8',
  compassRing: '#7A9AAA',
  compassDot: '#89B4C8',
  waveAccent: '#A8B8A0',
};

export default function CompassLogo({ size = 24, showLabel = false, className = '' }: CompassLogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // viewBox 120x120 — flipped vertically (upside down)
  return (
    <div className={`flex items-center gap-2 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        className="compass-logo"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="4" dy="4" stdDeviation="3" floodColor="#1a1a1a" floodOpacity="0.6"/>
          </filter>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width="120" height="120" fill={COLORS.background} />

        {/* FLIPPED VERTICALLY — logo-01 upside down */}
        <g transform="translate(0, 120) scale(1, -1)">
          {/* Layered depth - 3 stacked A's */}
          <g opacity="0.2" transform="translate(3,3)">
            <path d="M35,20 L25,70 M85,20 L95,70" stroke={COLORS.letterformDim} strokeWidth="4" strokeLinecap="round"/>
            <path d="M30,50 L90,50" stroke={COLORS.letterformDim} strokeWidth="3" strokeLinecap="round"/>
          </g>
          <g opacity="0.4" transform="translate(1.5,1.5)">
            <path d="M35,20 L25,70 M85,20 L95,70" stroke={COLORS.letterformDim} strokeWidth="4" strokeLinecap="round"/>
            <path d="M30,50 L90,50" stroke={COLORS.letterformDim} strokeWidth="3" strokeLinecap="round"/>
          </g>

          {/* Main bold wave A */}
          <g filter="url(#shadow)">
            <path d="M34,18 C42,28 48,40 52,50 C56,60 58,65 60,70" stroke={COLORS.letterformLight} strokeWidth="5" strokeLinecap="round" fill="none"/>
            <path d="M86,18 C78,28 72,40 68,50 C64,60 62,65 60,70" stroke={COLORS.letterformLight} strokeWidth="5" strokeLinecap="round" fill="none"/>
            <path d="M30,48 C45,46 60,46 75,48 C80,49 85,50 90,49" stroke={COLORS.letterformLight} strokeWidth="4" strokeLinecap="round" fill="none"/>
          </g>

          {/* Compass */}
          <g>
            <circle cx="60" cy="42" r="14" stroke={COLORS.compassRing} strokeWidth="1.5" fill="none"/>
            <path d="M60,28 L60,56 M46,42 L74,42" stroke={COLORS.letterformLight} strokeWidth="2" strokeLinecap="round"/>
            <circle cx="60" cy="42" r="3.5" fill={COLORS.compassDot} filter="url(#glow)"/>
          </g>

          {/* Wave ripples */}
          <g opacity="0.25">
            <path d="M52,58 C56,60 58,61 60,62 C62,61 64,60 68,58" stroke={COLORS.waveAccent} strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M50,62 C55,64 58,65 60,66 C62,65 65,64 70,62" stroke={COLORS.waveAccent} strokeWidth="0.8" strokeLinecap="round"/>
          </g>
        </g>

        <style>{`
          .compass-logo {
            animation: compassEntrance 0.6s ease-out forwards;
          }
          @keyframes compassEntrance {
            from { transform: scale(0.85) rotate(-10deg); opacity: 0; }
            to { transform: scale(1) rotate(0deg); opacity: 1; }
          }
        `}</style>
      </svg>

      {showLabel && (
        <span className="font-heading text-2xl text-primary tracking-wide hover:text-accent transition-colors">
          ASORIA
        </span>
      )}
    </div>
  );
}
