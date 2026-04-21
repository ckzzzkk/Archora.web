import type { Metadata } from 'next';
import FeatureSection from '@/components/FeatureSection';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Discover ASORIA features: AI floor plan generation, design studio, AR room scanning, 3D walkthroughs, and community templates.',
};

const FEATURES = [
  {
    title: 'AI Floor Plan Generation',
    description:
      'Meet ARIA, your personal AI architect. Through a guided 7-step interview, she learns exactly what you want — building type, plot size, room count, style preferences, and more. Then she generates a structurally sound blueprint accounting for weather patterns, physics, and building codes.',
    highlights: [
      '7-step guided design interview with ARIA',
      'Structural intelligence — accounts for load-bearing walls, ventilation, and natural light',
      'Voice input support via AI transcription',
      'Upload reference images for style inspiration',
      '12 architectural styles from Minimalist to Victorian',
      'Generate complete blueprints in under 30 seconds',
    ],
  },
  {
    title: 'Design Studio',
    description:
      'A professional-grade 2D and 3D design workspace right on your phone. Edit AI-generated blueprints or sketch from scratch. Place walls, doors, windows, and choose from over 65 procedural furniture pieces. Everything renders in real-time with our Skia and Three.js engines.',
    highlights: [
      'Full 2D blueprint editor with Skia canvas',
      'Wall, door, and window placement tools',
      '65+ procedural furniture pieces across 8 categories',
      'Multi-floor support up to 10 floors',
      'Undo/redo with shake gesture detection',
      'Auto-save with configurable intervals',
    ],
    reversed: true,
  },
  {
    title: 'AR System',
    description:
      'Bridge the gap between digital designs and physical spaces. ASORIA\'s augmented reality system lets you scan real rooms, place virtual furniture, and measure distances — all through your phone camera. Import scanned rooms directly into the design studio.',
    highlights: [
      'Photo Analysis mode — snap a photo, get room dimensions',
      'Manual Measure mode — point-to-point AR measurements',
      'Depth Scan mode — full 3D room capture',
      'Furniture placement in AR — see how pieces fit before buying',
      'Import scanned rooms into the design studio',
      'Works with ARKit (iOS) and ARCore (Android)',
    ],
  },
  {
    title: '3D Walkthrough',
    description:
      'Step inside your designs before they are built. Our immersive first-person walkthrough mode lets you explore every room, hallway, and outdoor space with realistic materials, lighting, and furniture. Share walkthrough recordings with clients or family.',
    highlights: [
      'First-person camera with smooth navigation',
      'Realistic material rendering and lighting',
      'Furniture and fixtures rendered in full 3D',
      'Walk through multi-floor buildings via staircases',
      '50+ wall textures and 30+ floor materials',
      'Screenshot and recording capture',
    ],
    reversed: true,
  },
  {
    title: 'Community & Templates',
    description:
      'Join a growing community of architects, designers, and enthusiasts. Browse published designs for inspiration, save your favourites, and rate the best ones. Publish your own templates to the marketplace and earn revenue with every download.',
    highlights: [
      'Browse thousands of community-published designs',
      'Like, save, rate, and comment on designs',
      'Publish your own templates to the marketplace',
      'Earn up to 80% revenue share on template sales',
      'Masonry layout feed with infinite scroll',
      'Follow your favourite designers',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-16 pb-8 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary font-heading text-sm tracking-widest uppercase mb-4">
            Platform Features
          </p>
          <h1 className="font-heading text-4xl md:text-5xl text-text mb-6">
            Built for architects, designers, and dreamers
          </h1>
          <p className="text-text-secondary font-body text-lg leading-relaxed">
            From AI-powered generation to immersive AR experiences, ASORIA gives
            you everything you need to bring architectural visions to life.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      {FEATURES.map((feature, i) => (
        <div
          key={feature.title}
          className={i % 2 === 1 ? 'bg-surface/30' : ''}
        >
          <FeatureSection
            title={feature.title}
            description={feature.description}
            highlights={feature.highlights}
            reversed={feature.reversed}
          />
        </div>
      ))}

      {/* Bottom CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-text mb-6">
            Ready to start designing?
          </h2>
          <p className="text-text-secondary font-body text-lg mb-10">
            Download ASORIA for free and explore the AI architecture studio.
          </p>
          <a
            href="/pricing"
            className="inline-block bg-primary text-background font-body font-semibold px-10 py-4 rounded-button text-sm hover:bg-accent transition-colors"
          >
            View Plans
          </a>
        </div>
      </section>
    </>
  );
}
