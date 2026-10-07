'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import PlanDrawing from '../plan/PlanDrawing';
import Typed from './Typed';

/** Where the hero's drawing comes to rest: walls, rooms, areas and dimensions, just before the plan is raised. */
const HERO_REST = 0.33;

export default function Hero() {
  const reduce = useReducedMotion();
  const progress = useMotionValue(reduce ? HERO_REST : 0);

  useEffect(() => {
    if (reduce) {
      progress.set(HERO_REST);
      return;
    }
    const controls = animate(progress, HERO_REST, { duration: 3.6, delay: 0.35, ease: [0.4, 0, 0.2, 1] });
    return () => controls.stop();
  }, [reduce, progress]);

  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-10 md:grid-cols-[0.95fr_1.15fr] md:gap-12 md:pb-32 md:pt-16">
      <div>
        <h1 className="font-display text-[2.9rem] sm:text-6xl lg:text-[4.4rem]">
          Describe a building. Watch it get drafted.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
          Answer a short interview and ASORIA draws the floor plan, builds the 3D model, furnishes it, and lets you walk the
          result through your phone&apos;s camera.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/pricing" className="btn btn-action">
            See the plans
          </Link>
          <a href="#story" className="btn btn-quiet">
            How it works
          </a>
        </div>
        <p className="mt-6 text-sm text-ink-3">Free to start. iOS and Android.</p>
      </div>

      <div className="relative">
        <figure className="rounded-2xl border border-rule bg-sheet p-3 sm:p-5 sh3">
          <div className="flex items-baseline justify-between px-1 pb-3">
            <figcaption className="font-display text-base">Ground floor</figcaption>
            <span className="num text-xs text-ink-3">scale 1:100</span>
          </div>
          <div className="rounded-lg bg-paper px-2 py-2">
            <PlanDrawing progress={progress} title="A drafted floor plan of a 96 square metre house: living room, kitchen, bedroom, bath and study" />
          </div>
        </figure>

        <aside
          aria-label="A note from ARIA"
          className="mt-4 rounded-xl border border-ai/30 bg-sheet p-4 sh2 sm:absolute sm:-bottom-12 sm:right-[-0.5rem] sm:mt-0 sm:w-[19rem]"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ai" aria-hidden />
            <span className="font-display text-sm text-ai-ink">ARIA</span>
          </div>
          <p className="text-sm leading-relaxed text-ink">
            <Typed
              delayMs={3300}
              text="I put the kitchen on the east wall for morning light, and left a 1.1 m opening so the living room stays open to it."
            />
          </p>
        </aside>
      </div>
    </section>
  );
}
