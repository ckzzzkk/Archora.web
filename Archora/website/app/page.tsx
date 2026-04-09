import Link from 'next/link';
import dynamic from 'next/dynamic';
import GlassCard from '@/components/GlassCard';
import AnimatedCounter from '@/components/AnimatedCounter';

const HeroScene = dynamic(() => import('@/components/HeroScene'), { ssr: false });

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'AI Floor Plan Generation',
    description: 'Describe your vision to ARIA, our AI architect. She designs structurally sound blueprints in seconds.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    title: 'AR Room Scanning',
    description: 'Point your phone at any room. ASORIA captures dimensions, walls, and features in augmented reality.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
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
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,255,253,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,238,140,0.04),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
          <div>
            <p className="text-primary font-heading text-sm tracking-widest uppercase mb-4">
              AI Architecture Platform
            </p>
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
                className="bg-primary text-background font-body font-semibold px-8 py-4 rounded-button text-sm hover:bg-accent transition-colors"
              >
                View Plans
              </Link>
              <Link
                href="/features"
                className="glass font-body font-medium text-text px-8 py-4 rounded-button text-sm hover:bg-glass-prominent transition-colors"
              >
                See Features
              </Link>
            </div>
          </div>

          <div className="h-[400px] lg:h-[500px]">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-24 px-6">
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
              <GlassCard
                key={feature.title}
                className="p-8 group hover:bg-glass-prominent transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="w-14 h-14 rounded-card bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl text-text mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary font-body text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-surface/50">
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
                <span className="font-mono text-5xl font-bold text-primary/20 block mb-4">
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

      {/* Stats strip */}
      <section className="py-20 px-6 border-y border-glass-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
              <AnimatedCounter target={10000} suffix="+" />
            </div>
            <p className="text-text-secondary font-body text-sm">Designs Generated</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
              <AnimatedCounter target={50000} suffix="+" />
            </div>
            <p className="text-text-secondary font-body text-sm">Rooms Scanned</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
              <AnimatedCounter target={4} suffix=".8" />
            </div>
            <p className="text-text-secondary font-body text-sm">App Rating</p>
          </div>
        </div>
      </section>

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
              className="bg-primary text-background font-body font-semibold px-10 py-4 rounded-button text-sm hover:bg-accent transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/features"
              className="glass font-body font-medium text-text px-10 py-4 rounded-button text-sm hover:bg-glass-prominent transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
