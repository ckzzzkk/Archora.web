'use client';

import { useEffect, useRef, useState } from 'react';
import { FloorPlanIcon, ARIcon, ThreeDIcon } from './SketchIcons';

const STEPS = [
  {
    number: '01',
    title: 'Describe',
    detail: 'Tell ARIA what you want — rooms, style, plot size. She listens to how you actually live.',
    icon: <FloorPlanIcon size={28} className="text-primary" />,
    screen: 'DescribeScreen',
  },
  {
    number: '02',
    title: 'Generate',
    detail: 'AI creates a full blueprint with walls, doors, furniture, and measurements — in seconds.',
    icon: <ThreeDIcon size={28} className="text-primary" />,
    screen: 'GenerateScreen',
  },
  {
    number: '03',
    title: 'Explore',
    detail: 'Walk through your design in immersive 3D or place it in your real room with AR.',
    icon: <ARIcon size={28} className="text-primary" />,
    screen: 'ExploreScreen',
  },
];

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 200);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center text-center transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Phone mockup */}
      <div
        className="relative mb-8 rounded-[1.8rem] overflow-hidden border border-border"
        style={{
          width: 140,
          height: 260,
          backgroundColor: '#1A1A1A',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl"
          style={{ width: 50, height: 16, backgroundColor: '#1A1A1A', borderBottom: '1px solid #333' }}
        />
        {/* Screen */}
        <div className="pt-6 px-3 h-full" style={{ backgroundColor: '#1A1A1A' }}>
          {index === 0 && (
            <svg viewBox="0 0 100 200" fill="none" className="w-full h-full">
              <text x="10" y="30" fontFamily="monospace" fontSize="8" fill="#9A9590">Describe your vision</text>
              <rect x="10" y="40" width="80" height="30" rx="4" stroke="#333" strokeWidth="1" />
              <text x="10" y="55" fontFamily="monospace" fontSize="6" fill="#5A5550" opacity="0.5">e.g. 3 bed cottage...</text>
              <rect x="10" y="80" width="80" height="12" rx="2" stroke="#333" strokeWidth="1" opacity="0.6" />
              <rect x="10" y="100" width="80" height="12" rx="2" stroke="#333" strokeWidth="1" opacity="0.4" />
              <rect x="10" y="120" width="80" height="12" rx="2" stroke="#333" strokeWidth="1" opacity="0.3" />
              <rect x="10" y="145" width="80" height="30" rx="50" stroke="#C8C8C8" strokeWidth="1.5" />
              <text x="50" y="163" fontFamily="monospace" fontSize="6" fill="#C8C8C8" textAnchor="middle">GENERATE</text>
            </svg>
          )}
          {index === 1 && (
            <svg viewBox="0 0 100 200" fill="none" className="w-full h-full">
              <rect x="10" y="20" width="80" height="100" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.7" />
              <path d="M50 20 L50 60" stroke="#C8C8C8" strokeWidth="1" opacity="0.6" />
              <path d="M10 60 L90 60" stroke="#C8C8C8" strokeWidth="1" opacity="0.6" />
              <rect x="15" y="25" width="25" height="18" rx="2" stroke="#C8C8C8" strokeWidth="1" opacity="0.5" />
              <text x="27" y="37" fontFamily="monospace" fontSize="5" fill="#5A5550" textAnchor="middle" opacity="0.5">LIVING</text>
              <text x="10" y="135" fontFamily="monospace" fontSize="7" fill="#9A9590">Blueprint ready</text>
              <text x="10" y="148" fontFamily="monospace" fontSize="6" fill="#5A5550">in 12 seconds</text>
            </svg>
          )}
          {index === 2 && (
            <svg viewBox="0 0 100 200" fill="none" className="w-full h-full">
              <path d="M30 30 L50 15 L70 30 L70 70 L50 85 L30 70 Z" stroke="#C8C8C8" strokeWidth="1.5" opacity="0.6" />
              <path d="M30 30 L30 70" stroke="#C8C8C8" strokeWidth="1" opacity="0.4" />
              <path d="M70 30 L70 70" stroke="#C8C8C8" strokeWidth="1" opacity="0.4" />
              <path d="M50 15 L50 85" stroke="#C8C8C8" strokeWidth="1" opacity="0.3" />
              <text x="50" y="120" fontFamily="monospace" fontSize="7" fill="#9A9590" textAnchor="middle">AR Preview</text>
              <rect x="25" y="135" width="50" height="20" rx="50" stroke="#7AB87A" strokeWidth="1.5" />
              <text x="50" y="148" fontFamily="monospace" fontSize="6" fill="#7AB87A" textAnchor="middle">PLACE IN ROOM</text>
            </svg>
          )}
        </div>
      </div>

      {/* Step content */}
      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-4 border border-border">
        {step.icon}
      </div>
      <span className="font-mono text-4xl font-bold text-primary text-opacity-10 block mb-2">
        {step.number}
      </span>
      <h3 className="font-heading text-xl text-text mb-2">{step.title}</h3>
      <p className="text-text-secondary font-body text-sm leading-relaxed max-w-xs">
        {step.detail}
      </p>
    </div>
  );
}

export default function AppWorkflowShowcase() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className={`font-heading text-3xl md:text-4xl text-text mb-4 transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            From idea to walk-through in minutes
          </h2>
          <p
            className={`text-text-secondary font-body text-lg max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            No templates. No blank canvas. Just describe and ASORIA generates
            the architecture — ready to explore in 3D or your own room via AR.
          </p>
        </div>

        {/* Desktop: horizontal arrows */}
        <div className="hidden md:grid grid-cols-3 gap-12 items-start">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              <StepCard step={step} index={i} />
              {i < STEPS.length - 1 && (
                <div className="absolute top-1/3 -right-8 transform -translate-y-0 hidden md:block">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12 L19 12 M13 6 L19 12 L13 18" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: stacked */}
        <div className="flex md:hidden flex-col gap-16 items-center">
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
