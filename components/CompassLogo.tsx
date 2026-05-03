'use client';

import { useEffect, useState } from 'react';

interface CompassLogoProps {
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export default function CompassLogo({ size = 24, showLabel = false, className = '' }: CompassLogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Logo lives in a 60x60 viewBox matching logo-final.svg proportions
  // A apex at (40,12), base at y=65, crossbar at y=46
  // Compass at (40,32) with r=10
  return (
    <div className={`flex items-center gap-2 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        className="compass-logo"
      >
        {/* Dark background */}
        <rect width="80" height="80" fill="#1A1A1A" />

        {/* Letterform: Narrow "A" — matching logo-final.svg */}
        {/* Left leg: (28,12) to (20,65) · Right leg: (52,12) to (60,65) · Crossbar at y=46 */}
        <path
          d="M28,12 L20,65 M52,12 L60,65 M26,46 L54,46"
          stroke="#C8C8C8"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Compass outer ring */}
        <circle cx="40" cy="32" r="10" stroke="#5A5550" strokeWidth="1" fill="none" />

        {/* 4-point compass star (N, E, S, W) */}
        <path
          d="M40,22 L40,42 M30,32 L50,32"
          stroke="#C8C8C8"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Compass center dot (Success Green) */}
        <circle cx="40" cy="32" r="2.5" fill="#7AB87A" />

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
