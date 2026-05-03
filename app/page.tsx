import Link from 'next/link';
import BlueprintCard from '@/components/BlueprintCard';
import AppWorkflowShowcase from '@/components/AppWorkflowShowcase';
import HeroDeviceFrame from '@/components/HeroDeviceFrame';
import {
  FloorPlanIcon,
  ARIcon,
  ThreeDIcon,
  CompassRose,
} from '@/components/SketchIcons';

const FEATURES = [
  {
    icon: <FloorPlanIcon size={32} className="text-primary" />,
    title: 'AI Floor Plan Generation',
    description: 'Describe your vision to ARIA, our AI architect. She designs structurally sound blueprints in seconds.',
  },
  {
    icon: <ARIcon size={32} className="text-primary" />,
    title: 'AR Room Scanning',
    description: 'Point your phone at any room. ASORIA captures dimensions, walls, and features in augmented reality.',
  },
  {
    icon: <ThreeDIcon size={32} className="text-primary" />,
    title: '3D Walkthrough',
    description: 'Step inside your design before it is built. Explore every room in immersive first-person 3D.',
  },
];

const STEPS = [
  { number: '01', title: 'Describe', detail: 'Tell ARIA what you want — rooms, style, plot size, anything.' },
  { number: '02', title: 'Generate', detail: 'AI creates a full blueprint with walls, doors, furniture, and more.' },
  { number: '03', title: 'Explore', detail: 'Walk through your design in 3D or view it in AR on your phone.' },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        {/* Radial accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,75,0.06),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CompassRose size={16} className="text-accent" />
              <p className="text-primary-dim font-mono text-xs tracking-widest uppercase">
                AI Architecture Platform
              </p>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-text leading-tight mb-6">
              Design Your Dream{' '}
              <span className="text-primary">Space</span> With{' '}
              <span className="text-accent">AI</span>
            </h1>
            <p className="text-text-secondary font-body text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
              Describe it. Build it. Walk through it. ASORIA turns your words into
              full architectural blueprints, 3D models, and AR experiences.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/pricing"
                className="bg-primary text-background font-body font-semibold px-8 py-4 rounded-button text-sm hover:bg-accent transition-colors btn-sketch"
              >
                View Plans
              </Link>
              <Link
                href="/features"
                className="border border-sketch text-text font-body font-medium px-8 py-4 rounded-button text-sm hover:bg-surface transition-colors"
              >
                See Features
              </Link>
            </div>
          </div>

          <div className="h-[400px] lg:h-[500px]">
            <HeroDeviceFrame />
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl text-text mb-4">
              Everything you need to design
            </h2>
            <p className="text-text-secondary font-body text-lg max-w-2xl mx-auto">
              From AI-generated floor plans to augmented reality room scanning,
              ASORIA is a complete architecture design studio in your pocket.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <BlueprintCard
                key={feature.title}
                className="p-8"
              >
                <div className="w-14 h-14 rounded-card bg-surface flex items-center justify-center text-primary mb-6 border border-border">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl text-text mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary font-body text-sm leading-relaxed">
                  {feature.description}
                </p>
              </BlueprintCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl text-text mb-4">
              How it works
            </h2>
            <p className="text-text-secondary font-body text-lg">
              Three steps from idea to immersive experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center md:text-left">
                <span className="font-mono text-5xl font-bold text-primary text-opacity-20 block mb-4">
                  {step.number}
                </span>
                <h3 className="font-heading text-2xl text-text mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary font-body text-sm leading-relaxed">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Workflow Showcase */}
      <AppWorkflowShowcase />

      {/* CTA banner */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl text-text mb-6">
            Ready to design?
          </h2>
          <p className="text-text-secondary font-body text-lg mb-10 max-w-2xl mx-auto">
            Download ASORIA and start creating AI-powered architectural designs
            today. Free to get started, no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="bg-primary text-background font-body font-semibold px-10 py-4 rounded-button text-sm hover:bg-accent transition-colors btn-sketch"
            >
              Get Started Free
            </Link>
            <Link
              href="/features"
              className="border border-sketch text-text font-body font-medium px-10 py-4 rounded-button text-sm hover:bg-surface transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
