'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { CORNERS, DOORS, FURNITURE, OUTER_WALL, PARTITIONS, PLAN, ROOMS, WINDOWS, areaM2, type Room } from './geometry';

/**
 * The drawing. Everything is driven by ONE progress value (0..1), so the same component runs the autoplay hero and
 * the scroll story, and nothing re-renders while it animates:
 *
 *   0.00-0.18  walls draw themselves
 *   0.14-0.26  rooms wash in (iris: ARIA drew them), labels and true areas appear
 *   0.22-0.32  dimension lines and measurements (mono)
 *   0.34-0.56  the plan is raised (oblique projection)
 *   0.58-0.78  furniture is drawn in
 *
 * Under reduced motion the caller passes a progress that is already at its final value.
 */
export default function PlanDrawing({
  progress,
  className = '',
  title,
}: {
  progress: MotionValue<number>;
  className?: string;
  title: string;
}) {
  const wall = useTransform(progress, [0, 0.18], [0, 1]);
  const partition = useTransform(progress, [0.06, 0.2], [0, 1]);
  const openings = useTransform(progress, [0.12, 0.22], [0, 1]);
  const wash = useTransform(progress, [0.14, 0.26], [0, 1]);
  const dims = useTransform(progress, [0.22, 0.32], [0, 1]);
  const raise = useTransform(progress, [0.34, 0.56], [0, 1]);
  const furnish = useTransform(progress, [0.58, 0.78], [0, 1]);

  // Oblique projection: a point at height h is drawn offset by (+0.55h, -0.8h).
  const H = 70;
  const dx = useTransform(raise, (v) => v * H * 0.55);
  const dy = useTransform(raise, (v) => v * -H * 0.8);
  const topOpacity = useTransform(raise, [0, 0.05, 1], [0, 1, 1]);
  const furnitureOpacity = useTransform(furnish, [0, 0.1], [0, 1]);

  return (
    <svg
      viewBox={PLAN.viewBox}
      role="img"
      aria-label={title}
      className={`h-auto w-full ${className}`}
      style={{ overflow: 'visible' }}
    >
      <title>{title}</title>

      {/* faint drafting grid, 1 m squares */}
      <defs>
        <pattern id="plan-grid" width="40" height="40" patternUnits="userSpaceOnUse" x="20" y="10">
          <path d="M40 0 H0 V40" fill="none" className="stroke-rule" strokeWidth="0.6" opacity="0.6" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="600" height="440" fill="url(#plan-grid)" />

      {/* room washes: iris, because ARIA drew them */}
      {ROOMS.map((r) => (
        <RoomWash key={r.id} room={r} wash={wash} />
      ))}

      {/* ground-level walls */}
      <motion.path d={OUTER_WALL} className="plan-stroke" strokeWidth="5" style={{ pathLength: wall }} />
      {PARTITIONS.map((d) => (
        <motion.path key={d} d={d} className="plan-stroke" strokeWidth="3" style={{ pathLength: partition }} />
      ))}
      {WINDOWS.map((d) => (
        <motion.path key={d} d={d} className="stroke-structure" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ pathLength: openings }} />
      ))}
      {DOORS.map((d) => (
        <motion.path key={d} d={d} className="plan-stroke" strokeWidth="1.5" opacity="0.6" style={{ pathLength: openings }} />
      ))}

      {/* the raised plan: tops of the walls, offset, joined to the base by verticals */}
      <motion.g style={{ opacity: topOpacity }}>
        {CORNERS.map(([x, y]) => (
          <Post key={`${x}-${y}`} x={x} y={y} dx={dx} dy={dy} />
        ))}
        <motion.g style={{ x: dx, y: dy }}>
          <path d={OUTER_WALL} className="plan-stroke" strokeWidth="3.5" />
          {PARTITIONS.map((d) => (
            <path key={d} d={d} className="plan-stroke" strokeWidth="2" opacity="0.8" />
          ))}
        </motion.g>
      </motion.g>

      {/* furniture */}
      <motion.g style={{ opacity: furnitureOpacity }}>
        {FURNITURE.map((d, i) => (
          <motion.path key={i} d={d} className="plan-stroke" strokeWidth="1.6" opacity="0.75" style={{ pathLength: furnish }} />
        ))}
      </motion.g>

      {/* labels and true areas */}
      {ROOMS.map((r) => (
        <motion.g key={r.id} style={{ opacity: wash }}>
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 2} textAnchor="middle" className="fill-ai-ink font-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', paintOrder: 'stroke', stroke: 'rgb(var(--paper))', strokeWidth: 5, strokeLinejoin: 'round' }}>
            {r.label}
          </text>
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 15} textAnchor="middle" className="num fill-ink-2" style={{ fontSize: 11, paintOrder: 'stroke', stroke: 'rgb(var(--paper))', strokeWidth: 5, strokeLinejoin: 'round' }}>
            {areaM2(r)} m²
          </text>
        </motion.g>
      ))}

      {/* dimension lines */}
      <motion.g style={{ opacity: dims }} className="stroke-ink-2" strokeWidth="1" fill="none">
        <path d="M60 28 H540 M60 22 V34 M540 22 V34" />
        <path d="M32 50 V370 M26 50 H38 M26 370 H38" />
      </motion.g>
      <motion.g style={{ opacity: dims }}>
        <rect x="270" y="18" width="60" height="20" rx="4" className="fill-paper" />
        <text x="300" y="32" textAnchor="middle" className="num fill-ink" style={{ fontSize: 12, fontWeight: 600 }}>
          12.00 m
        </text>
        <rect x="14" y="198" width="36" height="20" rx="4" className="fill-paper" />
        <text x="32" y="212" textAnchor="middle" className="num fill-ink" style={{ fontSize: 12, fontWeight: 600 }}>
          8.00 m
        </text>
      </motion.g>
    </svg>
  );
}

function RoomWash({ room, wash }: { room: Room; wash: MotionValue<number> }) {
  const opacity = useTransform(wash, [0, 1], [0, 0.1]);
  return <motion.rect x={room.x} y={room.y} width={room.w} height={room.h} className="fill-ai" style={{ opacity }} />;
}

/** A vertical edge of the raised model: from the wall junction on the ground to the same junction at height. */
function Post({ x, y, dx, dy }: { x: number; y: number; dx: MotionValue<number>; dy: MotionValue<number> }) {
  const x2 = useTransform(dx, (v) => x + v);
  const y2 = useTransform(dy, (v) => y + v);
  return <motion.line x1={x} y1={y} x2={x2} y2={y2} className="stroke-ink-2" strokeWidth="1.4" />;
}
