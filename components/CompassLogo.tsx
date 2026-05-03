'use client';

import { useEffect, useState } from 'react';

export default function CompassLogo({ size = 24, showLabel = false }: { size?: number; showLabel?: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex items-center gap-2 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        className="compass-logo"
        style={{ filter: 'drop-shadow(0 0 6px rgba(200,200,200,0.15))' }}
      >
        {/* Outer rings */}
        <circle cx="30" cy="30" r="28" stroke="#333333" strokeWidth="1" opacity="0.6" />
        <circle cx="30" cy="30" r="22" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.8" />
        <circle cx="30" cy="30" r="2" fill="#C8C8C8" />

        {/* Cardinal ticks */}
        <line x1="30" y1="4" x2="30" y2="10" stroke="#C8C8C8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="56" y1="30" x2="50" y2="30" stroke="#C8C8C8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="56" x2="30" y2="50" stroke="#C8C8C8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="30" x2="10" y2="30" stroke="#C8C8C8" strokeWidth="1.5" strokeLinecap="round" />

        {/* Minor ticks */}
        <line x1="42" y1="10" x2="40" y2="14" stroke="#C8C8C8" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="50" y1="42" x2="46" y2="40" stroke="#C8C8C8" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="18" y1="50" x2="20" y2="46" stroke="#C8C8C8" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="10" y1="18" x2="14" y2="20" stroke="#C8C8C8" strokeWidth="1" strokeLinecap="round" opacity="0.5" />

        {/* North pointer — glowing */}
        <path
          d="M30 6 L32 18 L30 16 L28 18 Z"
          fill="#F0EDE8"
          stroke="#F0EDE8"
          strokeWidth="1"
          strokeLinejoin="round"
          className="compass-north"
        />
        {/* South pointer */}
        <path
          d="M30 54 L28 42 L30 44 L32 42 Z"
          fill="#5A5550"
          stroke="#5A5550"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.6"
        />
        {/* East pointer */}
        <path
          d="M54 30 L42 28 L44 30 L42 32 Z"
          fill="#9A9590"
          stroke="#9A9590"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.4"
        />
        {/* West pointer */}
        <path
          d="M6 30 L18 32 L16 30 L18 28 Z"
          fill="#9A9590"
          stroke="#9A9590"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.4"
        />

        {/* N label */}
        <text x="27.5" y="3.5" fontFamily="monospace" fontSize="5" fill="#9A9590">N</text>

        <style>{`
          .compass-north {
            animation: compassNorthPulse 3s ease-in-out infinite;
          }
          @keyframes compassNorthPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .compass-logo {
            animation: compassEntrance 0.8s ease-out forwards;
          }
          @keyframes compassEntrance {
            from { transform: scale(0.8) rotate(-20deg); opacity: 0; }
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
