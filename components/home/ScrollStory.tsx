'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import PlanDrawing from '../plan/PlanDrawing';
import PhoneScan from './PhoneScan';

const STEPS = [
  {
    name: 'Draft',
    text: 'A short interview about the plot, the rooms and the style, typed or spoken. ARIA lays the rooms out around real structure and checks the result before you see it.',
  },
  {
    name: 'Raise',
    text: 'The plan becomes a 3D model you can orbit, light with the sun at your site, and walk through.',
  },
  {
    name: 'Furnish',
    text: 'Place pieces from a library of 65+, or build your own from a photo or a description on the higher plans.',
  },
  {
    name: 'Walk through',
    text: 'Scan a real room with your camera, place furniture at true size, and measure walls and openings.',
  },
] as const;

/** Step boundaries along the scroll of the chapter (0..1). */
const BOUNDS = [0, 0.08, 0.38, 0.7] as const;
const stepAt = (p: number) => (p >= BOUNDS[3] ? 3 : p >= BOUNDS[2] ? 2 : p >= BOUNDS[1] ? 1 : 0);

export default function ScrollStory() {
  const reduce = useReducedMotion();
  return reduce ? <StaticStory /> : <PinnedStory />;
}

function PinnedStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);
  const finished = useMotionValue(0.8);
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(stepAt(p)));

  // The plan carries on from where the hero left it (0.33) to the furnished plan (0.8), then hands over to the phone.
  // Explicit, clamped maths (not range lookups): past the end of the chapter the state must stay exactly at its final value.
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const planProgress = useTransform(scrollYProgress, (v) => 0.33 + 0.47 * clamp01(v / 0.7));
  const planOpacity = useTransform(scrollYProgress, (v) => clamp01((0.72 - v) / 0.06));
  const phoneOpacity = useTransform(scrollYProgress, (v) => clamp01((v - 0.72) / 0.06));
  const phoneProgress = useTransform(scrollYProgress, (v) => clamp01((v - 0.74) / 0.26));
  const railFill = useTransform(scrollYProgress, (v) => `${clamp01(v) * 100}%`);

  return (
    <section id="story" ref={ref} aria-label="How ASORIA works" className="relative h-[430vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-6 pt-20 md:grid-cols-[0.8fr_1.2fr] md:gap-14">
          {/* chapters */}
          <div className="order-2 md:order-1">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">From a sentence to a room you can stand in.</h2>
            <div className="relative mt-8 hidden pl-6 md:block">
              <div className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full bg-rule" aria-hidden />
              <motion.div className="absolute left-0 top-1 w-0.5 rounded-full bg-action" style={{ height: railFill, maxHeight: 'calc(100% - 0.5rem)' }} aria-hidden />
              <ol className="space-y-5">
                {STEPS.map((s, i) => (
                  <li key={s.name} aria-current={i === step ? 'step' : undefined} className={`transition-opacity duration-300 ${i === step ? 'opacity-100' : 'opacity-70'}`}>
                    <p className="font-display text-xl">{s.name}</p>
                    <p className={`mt-1 max-w-sm text-[0.95rem] leading-relaxed text-ink-2 ${i === step ? 'block' : 'hidden'}`}>{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
            {/* phone: one chapter at a time */}
            <div className="mt-5 md:hidden" aria-live="polite">
              <p className="font-display text-xl">{STEPS[step].name}</p>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-2">{STEPS[step].text}</p>
              <div className="mt-4 flex gap-1.5" aria-hidden>
                {STEPS.map((s, i) => (
                  <span key={s.name} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-action' : 'bg-rule'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* the sheet */}
          <div className="order-1 md:order-2">
            <div className="relative mx-auto max-w-[34rem] rounded-2xl border border-rule bg-sheet p-3 sm:p-5 sh3 md:max-w-none">
              <div className="relative rounded-lg bg-paper px-2 py-3" style={{ aspectRatio: '600 / 470' }}>
                <motion.div className="absolute inset-0 flex items-center px-2" style={{ opacity: planOpacity }}>
                  <PlanDrawing progress={planProgress} title="The floor plan being raised into a 3D model and furnished" />
                </motion.div>
                <motion.div className="absolute inset-0 flex items-center justify-center gap-5 px-3" style={{ opacity: phoneOpacity }}>
                  <div className="hidden w-[48%] sm:block">
                    <PlanDrawing progress={finished} title="The finished, furnished plan of the house" />
                  </div>
                  <PhoneScan progress={phoneProgress} className="h-full w-auto" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Reduced motion: no pinning, no scrubbing. The four chapters as a plain list beside the finished drawing. */
function StaticStory() {
  const done = useMotionValue(0.8);
  const scan = useMotionValue(1);
  return (
    <section id="story" aria-label="How ASORIA works" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">From a sentence to a room you can stand in.</h2>
      <div className="mt-10 grid items-start gap-10 md:grid-cols-2">
        <ol className="space-y-6">
          {STEPS.map((s) => (
            <li key={s.name}>
              <p className="font-display text-xl">{s.name}</p>
              <p className="mt-1 max-w-md text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="space-y-6">
          <div className="rounded-2xl border border-rule bg-sheet p-4 sh2">
            <PlanDrawing progress={done} title="The finished, furnished floor plan" />
          </div>
          <div className="mx-auto w-48">
            <PhoneScan progress={scan} />
          </div>
        </div>
      </div>
    </section>
  );
}
