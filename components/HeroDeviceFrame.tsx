'use client';

import { useEffect, useState } from 'react';

export default function HeroDeviceFrame() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow behind device */}
      <div
        className="absolute inset-0 rounded-[3rem] blur-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(200,200,200,0.08) 0%, transparent 70%)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Phone frame */}
      <div
        className={`relative transition-all duration-1000 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
        style={{ animation: 'floatDevice 6s ease-in-out infinite', animationDelay: '1s' }}
      >
        <div
          className="relative rounded-[2.5rem] overflow-hidden border-2"
          style={{
            borderColor: '#333333',
            backgroundColor: '#1A1A1A',
            width: 280,
            height: 560,
            boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(200,200,200,0.05)',
          }}
        >
          {/* Notch */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl"
            style={{
              width: 80,
              height: 24,
              backgroundColor: '#1A1A1A',
              borderBottom: '1px solid #333333',
              zIndex: 10,
            }}
          />

          {/* Screen content — animated blueprint */}
          <div className="pt-10 px-3 pb-4 h-full" style={{ backgroundColor: '#1A1A1A' }}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <span className="font-mono text-xs" style={{ color: '#5A5550' }}>ASORIA</span>
              <span className="font-mono text-xs" style={{ color: '#5A5550' }}>3:41</span>
            </div>

            {/* App screen: blueprint */}
            <svg viewBox="0 0 240 480" fill="none" className="w-full h-full">
              {/* Grid dots */}
              {Array.from({ length: 12 }).map((_, row) =>
                Array.from({ length: 8 }).map((__, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={col * 28 + 14}
                    cy={row * 38 + 14}
                    r="1.5"
                    fill="#333333"
                    opacity="0.5"
                  />
                ))
              )}

              {/* Building walls */}
              <rect x="30" y="80" width="180" height="120" stroke="#C8C8C8" strokeWidth="2" opacity="0.8" />
              {/* Rooms */}
              <path d="M120 80 L120 130" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.7" />
              <path d="M120 130 L200 130" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.7" />
              <path d="M30 160 L30 200" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.7" />
              {/* Windows */}
              <rect x="55" y="78" width="20" height="3" stroke="#C8C8C8" strokeWidth="1" opacity="0.7" />
              <rect x="155" y="78" width="20" height="3" stroke="#C8C8C8" strokeWidth="1" opacity="0.7" />
              {/* Door */}
              <path d="M120 192 Q128 200 128 210" stroke="#C8C8C8" strokeWidth="1.5" fill="none" />
              <path d="M120 192 L128 192" stroke="#C8C8C8" strokeWidth="1.5" />
              {/* Furniture */}
              <rect x="40" y="95" width="55" height="22" rx="3" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.5" />
              <text x="67" y="109" fontFamily="monospace" fontSize="6" fill="#5A5550" textAnchor="middle" opacity="0.6">SOFA</text>
              <ellipse cx="155" cy="110" rx="20" ry="12" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.5" />
              <text x="155" y="113" fontFamily="monospace" fontSize="6" fill="#5A5550" textAnchor="middle" opacity="0.6">TABLE</text>

              {/* Dimension lines */}
              <path d="M30 210 L210 210" stroke="#5A5550" strokeWidth="0.75" />
              <text x="120" y="220" fontFamily="monospace" fontSize="7" fill="#5A5550" textAnchor="middle">8.0m</text>

              {/* Compass rose */}
              <g transform="translate(200, 240)">
                <circle cx="15" cy="15" r="13" stroke="#333333" strokeWidth="0.75" />
                <path d="M15 4 L16 10 L15 9 L14 10 Z" stroke="#C8C8C8" strokeWidth="1" fill="none" />
                <path d="M15 26 L14 20 L15 21 L16 20 Z" stroke="#C8C8C8" strokeWidth="0.75" fill="none" opacity="0.5" />
              </g>

              {/* App label */}
              <text x="20" y="250" fontFamily="monospace" fontSize="6" fill="#9A9590" opacity="0.5">ARIA-GENERATED</text>

              {/* Bottom nav dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: '#C8C8C8', opacity: 0.8 }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#333333' }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#333333' }} />
              </div>

              {/* Status bar */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-20 h-1.5 rounded-full" style={{ backgroundColor: '#2C2C2C' }} />
            </svg>
          </div>

          {/* Side buttons */}
          <div className="absolute -left-1 top-24 w-0.5 h-8 rounded-l" style={{ backgroundColor: '#333333' }} />
          <div className="absolute -left-1 top-36 w-0.5 h-6 rounded-l" style={{ backgroundColor: '#333333' }} />
          <div className="absolute -right-1 top-28 w-0.5 h-12 rounded-r" style={{ backgroundColor: '#333333' }} />
        </div>
      </div>

      <style>{`
        @keyframes floatDevice {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
