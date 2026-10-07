'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';

/**
 * The last chapter: a phone looking at a real room. A scan line sweeps the room, and the measurements it finds land
 * as chips. `progress` runs 0..1 over the chapter.
 */
export default function PhoneScan({ progress, className = '' }: { progress: MotionValue<number>; className?: string }) {
  const scanY = useTransform(progress, [0, 1], [150, 470]);
  const found = useTransform(progress, [0.25, 0.5], [0, 1]);
  const done = useTransform(progress, [0.8, 0.95], [0, 1]);
  const foundY = useTransform(found, [0, 1], [8, 0]);

  return (
    <svg viewBox="0 0 320 600" role="img" aria-label="A phone scanning a room with the camera, finding its walls and measuring them" className={`h-auto w-full ${className}`}>
      <title>A phone scanning a room, measuring its walls</title>
      {/* device */}
      <rect x="20" y="10" width="280" height="580" rx="40" className="fill-sheet stroke-rule" strokeWidth="2" />
      <rect x="34" y="24" width="252" height="552" rx="30" className="fill-paper-deep" />
      <rect x="120" y="32" width="80" height="16" rx="8" className="fill-ink" opacity="0.85" />

      {/* the room, in one-point perspective */}
      <g className="stroke-ink-2" fill="none" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M58 120 L262 120 L262 420 L58 420 Z" opacity="0.25" />
        <path d="M110 190 H210 V350 H110 Z" />
        <path d="M58 120 L110 190 M262 120 L210 190 M58 420 L110 350 M262 420 L210 350" />
        <path d="M130 215 H190 V248 H130 Z" opacity="0.8" />
      </g>
      <g className="fill-ink-3" opacity="0.5">
        <rect x="146" y="304" width="28" height="46" rx="3" />
      </g>

      {/* the scan line */}
      <motion.g style={{ y: scanY }}>
        <rect x="40" y="-10" width="240" height="20" className="fill-success" opacity="0.18" />
        <rect x="40" y="-1.5" width="240" height="3" className="fill-success" />
      </motion.g>

      {/* measurements it found */}
      <motion.g style={{ opacity: found, y: foundY }}>
        <rect x="108" y="96" width="104" height="26" rx="8" className="fill-sheet stroke-rule" />
        <text x="160" y="114" textAnchor="middle" className="num fill-ink" style={{ fontSize: 13, fontWeight: 600 }}>4.52 m</text>
        <rect x="258" y="250" width="40" height="0" />
        <g transform="translate(270 270) rotate(90)">
          <rect x="-34" y="-13" width="68" height="26" rx="8" className="fill-sheet stroke-rule" />
          <text x="0" y="5" textAnchor="middle" className="num fill-ink" style={{ fontSize: 13, fontWeight: 600 }}>3.01 m</text>
        </g>
      </motion.g>

      {/* result */}
      <motion.g style={{ opacity: done }}>
        <rect x="64" y="470" width="192" height="64" rx="14" className="fill-sheet stroke-rule" />
        <circle cx="88" cy="502" r="11" className="fill-success" />
        <path d="M82.5 502.5 L86.5 506.5 L94 497.5" fill="none" className="stroke-success-on" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="110" y="498" className="fill-ink font-display" style={{ fontSize: 15, fontWeight: 700, wordSpacing: "0.18em" }}>Room scanned</text>
        <text x="110" y="518" className="num fill-ink-2" style={{ fontSize: 12 }}>13.6 m², ceiling 2.70 m</text>
      </motion.g>
    </svg>
  );
}
