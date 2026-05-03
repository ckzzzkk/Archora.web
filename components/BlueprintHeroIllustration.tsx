'use client';

export default function BlueprintHeroIllustration() {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ maxHeight: 480 }}
    >
      {/* Grid dots */}
      {Array.from({ length: 20 }).map((_, row) =>
        Array.from({ length: 30 }).map((__, col) => (
          <circle
            key={`${row}-${col}`}
            cx={col * 20 + 10}
            cy={row * 20 + 10}
            r="1.5"
            fill="#333333"
            opacity="0.6"
          />
        ))
      )}

      {/* Outer walls */}
      {/* Main building footprint */}
      <rect x="120" y="100" width="360" height="200" stroke="#C8C8C8" strokeWidth="3" opacity="0.9" />

      {/* Entry hall */}
      <rect x="120" y="300" width="80" height="50" stroke="#C8C8C8" strokeWidth="2" opacity="0.7" />

      {/* Living room wall */}
      <path d="M250 100 L250 200" stroke="#C8C8C8" strokeWidth="2" opacity="0.8" />
      {/* Kitchen/dining divider */}
      <path d="M250 200 L400 200" stroke="#C8C8C8" strokeWidth="2" opacity="0.8" />
      {/* Bedroom corridor */}
      <path d="M400 100 L400 300" stroke="#C8C8C8" strokeWidth="2" opacity="0.8" />
      {/* Master bedroom divider */}
      <path d="M250 100 L250 60 L400 60" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 2" />
      {/* Garage */}
      <rect x="480" y="200" width="80" height="100" stroke="#D4A84B" strokeWidth="2" opacity="0.7" />
      {/* Garden/terrace */}
      <rect x="100" y="350" width="400" height="40" stroke="#7AB87A" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />

      {/* Room labels */}
      {/* Living */}
      <text x="180" y="160" fontFamily="monospace" fontSize="11" fill="#9A9590" opacity="0.8">LIVING</text>
      <text x="180" y="174" fontFamily="monospace" fontSize="9" fill="#5A5550" opacity="0.6">4.5m × 5.0m</text>

      {/* Kitchen */}
      <text x="300" y="160" fontFamily="monospace" fontSize="11" fill="#9A9590" opacity="0.8">KITCHEN</text>
      <text x="300" y="174" fontFamily="monospace" fontSize="9" fill="#5A5550" opacity="0.6">3.0m × 4.0m</text>

      {/* Dining */}
      <text x="300" y="240" fontFamily="monospace" fontSize="11" fill="#9A9590" opacity="0.8">DINING</text>
      <text x="300" y="254" fontFamily="monospace" fontSize="9" fill="#5A5550" opacity="0.6">3.0m × 3.5m</text>

      {/* Master bedroom */}
      <text x="430" y="130" fontFamily="monospace" fontSize="11" fill="#9A9590" opacity="0.8">MASTER</text>
      <text x="430" y="144" fontFamily="monospace" fontSize="9" fill="#5A5550" opacity="0.6">3.5m × 4.0m</text>

      {/* Bedroom 2 */}
      <text x="305" y="130" fontFamily="monospace" fontSize="11" fill="#9A9590" opacity="0.8">BED 2</text>

      {/* Bathroom */}
      <text x="180" y="250" fontFamily="monospace" fontSize="11" fill="#9A9590" opacity="0.8">BATH</text>

      {/* Garage */}
      <text x="500" y="255" fontFamily="monospace" fontSize="10" fill="#D4A84B" opacity="0.7">GARAGE</text>

      {/* Entry */}
      <text x="130" y="330" fontFamily="monospace" fontSize="10" fill="#9A9590" opacity="0.6">ENTRY</text>

      {/* Compass rose - top right */}
      <g transform="translate(530, 60)">
        <circle cx="20" cy="20" r="18" stroke="#333333" strokeWidth="1" />
        <circle cx="20" cy="20" r="1" stroke="#C8C8C8" strokeWidth="1" />
        <path d="M20 4 L21.5 14 L20 12 L18.5 14 Z" stroke="#C8C8C8" strokeWidth="1.5" fill="none" />
        <path d="M20 36 L18.5 26 L20 28 L21.5 26 Z" stroke="#C8C8C8" strokeWidth="1" fill="none" opacity="0.5" />
        <text x="17" y="3" fontFamily="monospace" fontSize="7" fill="#9A9590">N</text>
      </g>

      {/* Dimension line - width */}
      <path d="M120 380 L480 380" stroke="#5A5550" strokeWidth="1" />
      <path d="M120 376 L120 384" stroke="#5A5550" strokeWidth="1" />
      <path d="M480 376 L480 384" stroke="#5A5550" strokeWidth="1" />
      <text x="290" y="394" fontFamily="monospace" fontSize="10" fill="#5A5550" textAnchor="middle">12.0m</text>

      {/* Dimension line - height */}
      <path d="M90 100 L90 300" stroke="#5A5550" strokeWidth="1" />
      <path d="M86 100 L94 100" stroke="#5A5550" strokeWidth="1" />
      <path d="M86 300 L94 300" stroke="#5A5550" strokeWidth="1" />
      <text x="82" y="204" fontFamily="monospace" fontSize="10" fill="#5A5550" textAnchor="middle" transform="rotate(-90, 82, 204)">8.0m</text>

      {/* Door symbols */}
      <path d="M250 293 Q265 300 265 315" stroke="#C8C8C8" strokeWidth="1.5" fill="none" />
      <path d="M250 293 L265 293" stroke="#C8C8C8" strokeWidth="1.5" />
      <path d="M400 293 Q415 300 415 315" stroke="#C8C8C8" strokeWidth="1.5" fill="none" />
      <path d="M400 293 L415 293" stroke="#C8C8C8" strokeWidth="1.5" />

      {/* Window symbols */}
      <rect x="145" y="98" width="30" height="4" stroke="#C8C8C8" strokeWidth="1" opacity="0.8" />
      <rect x="335" y="98" width="30" height="4" stroke="#C8C8C8" strokeWidth="1" opacity="0.8" />
      <rect x="450" y="98" width="20" height="4" stroke="#C8C8C8" strokeWidth="1" opacity="0.8" />

      {/* Furniture - sofa in living */}
      <rect x="145" y="140" width="80" height="30" rx="4" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.6" />
      <text x="185" y="158" fontFamily="monospace" fontSize="8" fill="#5A5550" textAnchor="middle" opacity="0.5">SOFA</text>

      {/* Dining table */}
      <ellipse cx="320" cy="230" rx="25" ry="15" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.6" />
      <text x="320" y="233" fontFamily="monospace" fontSize="8" fill="#5A5550" textAnchor="middle" opacity="0.5">TABLE</text>

      {/* Bed in master */}
      <rect x="440" y="150" width="40" height="60" rx="2" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.5" />
      <text x="460" y="183" fontFamily="monospace" fontSize="7" fill="#5A5550" textAnchor="middle" opacity="0.5">BED</text>

      {/* Roof outline */}
      <path d="M110 100 L300 40 L510 100" stroke="#D4A84B" strokeWidth="2" opacity="0.4" strokeDasharray="6 4" />

      {/* Sketchy title */}
      <text x="120" y="80" fontFamily="monospace" fontSize="10" fill="#9A9590" letterSpacing="2" opacity="0.6">ARIA-GENERATED BLUEPRINT</text>
    </svg>
  );
}
