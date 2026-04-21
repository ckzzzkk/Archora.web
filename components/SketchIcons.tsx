// Sketchy SVG icons for ASORIA ink-blueprint design language
// All icons use stroke-only SVG style, no fills, consistent 1.5px stroke weight

export function CompassRose({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="1.5" />
      {/* North pointer */}
      <path d="M12 3 L13.2 8 L12 7 L10.8 8 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* South pointer */}
      <path d="M12 21 L10.8 16 L12 17 L13.2 16 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* E pointer */}
      <path d="M21 12 L16 10.8 L17 12 L16 13.2 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* W pointer */}
      <path d="M3 12 L8 13.2 L7 12 L8 10.8 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export function FloorPlanIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Outer walls */}
      <rect x="3" y="3" width="18" height="18" rx="0" stroke="currentColor" strokeWidth="1.5" />
      {/* Front door */}
      <path d="M12 3 L12 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 1" />
      {/* Interior walls */}
      <path d="M3 12 L9 12 L9 9" stroke="currentColor" strokeWidth="1" />
      <path d="M12 12 L18 12" stroke="currentColor" strokeWidth="1" />
      <path d="M12 12 L12 18" stroke="currentColor" strokeWidth="1" />
      {/* Windows */}
      <rect x="7" y="3" width="3" height="1.5" stroke="currentColor" strokeWidth="1" />
      <rect x="14" y="3" width="3" height="1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function HouseIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Roof */}
      <path d="M2 10 L7 4 L12 8 L17 4 L22 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Walls */}
      <rect x="5" y="10" width="14" height="10" stroke="currentColor" strokeWidth="1.5" />
      {/* Door */}
      <rect x="10" y="14" width="4" height="6" stroke="currentColor" strokeWidth="1.5" />
      {/* Window */}
      <rect x="7" y="12" width="2.5" height="2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function ARIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Camera body */}
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {/* Lens */}
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Lens inner */}
      <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="1" />
      {/* Viewfinder */}
      <rect x="8" y="3" width="8" height="3" rx="1" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function RoomScanIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Room corners */}
      <path d="M4 4 L8 4 L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 4 L16 4 L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 20 L8 20 L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 20 L16 20 L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Room interior */}
      <rect x="8" y="8" width="8" height="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      {/* Scan lines */}
      <path d="M2 12 L22 12" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1 2" />
    </svg>
  );
}

export function FurnitureIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Sofa */}
      <rect x="3" y="10" width="18" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Sofa back */}
      <path d="M3 10 L3 7 Q3 6 4 6 L20 6 Q21 6 21 7 L21 10" stroke="currentColor" strokeWidth="1.5" />
      {/* Cushions */}
      <path d="M6 10 L6 14" stroke="currentColor" strokeWidth="1" />
      <path d="M12 10 L12 14" stroke="currentColor" strokeWidth="1" />
      <path d="M18 10 L18 14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function ThreeDIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* 3D cube */}
      <path d="M12 3 L20 7.5 L20 16.5 L12 21 L4 16.5 L4 7.5 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 3 L12 21" stroke="currentColor" strokeWidth="1" />
      <path d="M4 7.5 L20 7.5" stroke="currentColor" strokeWidth="1" />
      <path d="M12 3 L20 7.5 M12 3 L4 7.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function GridIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="4" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="4" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="4" cy="12" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="12" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="4" cy="20" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="20" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="20" r="1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function PencilIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16 3 L21 8 L8 21 L3 21 L3 16 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M13 6 L18 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 13 L9 17 L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12 L19 12 M13 6 L19 12 L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
