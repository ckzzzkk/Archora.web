import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'What ASORIA does: a guided AI interview that drafts your plan, a design studio, furniture, an AR room scanner, 3D walkthroughs and a community of shared designs.',
};

interface Chapter {
  id: string;
  title: string;
  lead: string;
  points: Array<{ term: string; detail: string }>;
}

/** Facts here mirror the app's tier limits and feature list; plan names say where a feature starts. */
const CHAPTERS: Chapter[] = [
  {
    id: 'generation',
    title: 'Meet ARIA, your AI architect',
    lead: 'Not a single text box. ARIA interviews you in seven short steps, the way a designer would, then drafts a plan around your answers.',
    points: [
      { term: 'The interview', detail: 'Building type, plot size, rooms and extras, style, an optional reference photo, notes, then a review before anything is generated.' },
      { term: 'Speak or type', detail: 'Dictate your notes and ARIA transcribes them (Pro and Architect).' },
      { term: '16 design styles', detail: 'From minimalist to rustic. Starter includes three; every paid plan includes all of them.' },
      { term: 'Checked before you see it', detail: 'Each plan comes with an engineering report on structure, light and exits that you can read and act on.' },
      { term: 'Plans per month', detail: '40 on Creator, 100 on Pro, 300 on Architect.' },
    ],
  },
  {
    id: 'studio',
    title: 'A design studio in your hand',
    lead: 'Edit what ARIA drew, or start from a blank sketch. Everything works in 2D and 3D, and everything can be undone.',
    points: [
      { term: 'Walls, doors, windows', detail: 'Draw and adjust them on a smooth 2D canvas, then switch to 3D and orbit the result.' },
      { term: 'Multiple floors', detail: 'Up to 5 floors on Creator, 10 on Pro and 20 on Architect.' },
      { term: 'Sun study', detail: 'See how light falls through the day at your site (Creator and up).' },
      { term: 'Undo, redo, shake', detail: 'Step back through your changes, or shake your phone to undo.' },
      { term: 'Saved as you go', detail: 'Paid plans save automatically, as often as every 30 seconds.' },
    ],
  },
  {
    id: 'furniture',
    title: 'Furniture that fits',
    lead: 'Furnish a room from a library, or make a piece that does not exist yet.',
    points: [
      { term: '65+ pieces', detail: 'Sofas, beds, tables, storage, bathroom and outdoor furniture, all in true size.' },
      { term: 'Your own pieces', detail: 'Photograph a chair or describe a sofa and ASORIA builds a model you can place in your design (higher plans).' },
      { term: 'Finishes', detail: 'Choose from 50 wall textures and 30 floor materials, or generate a custom texture (Pro and Architect).' },
    ],
  },
  {
    id: 'ar',
    title: 'Your camera is a tape measure',
    lead: 'Bring the real room into the design, and the design into the real room.',
    points: [
      { term: 'Scan', detail: 'Turn a room into a plan with your camera (Creator and up: 15 scans a month, unlimited on Pro and Architect).' },
      { term: 'Place', detail: 'See furniture at true size in the space before you commit (Creator and up).' },
      { term: 'Measure', detail: 'Measure walls, openings and distances point to point (Pro and Architect).' },
      { term: 'Bring it back', detail: 'Import a scanned room into the studio and keep designing.' },
      { term: 'Your device', detail: 'Works with ARKit on iPhone and ARCore on Android.' },
    ],
  },
  {
    id: 'walkthrough',
    title: 'Walk through it before it exists',
    lead: 'Step inside the model and look around.',
    points: [
      { term: 'First person', detail: 'Move through rooms, hallways and up staircases on multi-floor buildings.' },
      { term: 'Cinematic tour', detail: 'Turn a walkthrough into a shareable tour (watermarked on Creator, clean on Pro and Architect).' },
      { term: 'Renders', detail: 'Make photoreal renders of your design: 5 a month on Creator, 30 on Pro, 100 on Architect.' },
    ],
  },
  {
    id: 'community',
    title: 'Share what you drew',
    lead: 'Inspo is where ASORIA designs are shared.',
    points: [
      { term: 'Browse and save', detail: 'Explore designs, like, save, rate and comment. Reading is free on every plan.' },
      { term: 'Publish templates', detail: 'Creators can publish 5 templates; Pro and Architect have no limit.' },
      { term: 'Earn from them', detail: 'Creators and Pro keep 60% of template sales, Architect keeps 70%.' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-6 pt-10 md:pt-16">
        <h1 className="font-display max-w-3xl text-5xl sm:text-6xl">From a first question to a finished room.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
          Everything below runs on your phone. Features say which plan they start on, and every plan is listed on the{' '}
          <Link href="/pricing" className="font-semibold text-structure-ink underline decoration-structure/40 underline-offset-4 hover:decoration-structure">
            pricing page
          </Link>
          .
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-24">
        {CHAPTERS.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-28 border-t border-rule py-14 md:grid md:grid-cols-[0.9fr_1.1fr] md:gap-14">
            <div className="md:sticky md:top-28 md:self-start">
              <h2 className="font-display text-3xl sm:text-4xl">{c.title}</h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-2">{c.lead}</p>
            </div>
            <dl className="mt-8 divide-y divide-rule-soft md:mt-0">
              {c.points.map((p) => (
                <div key={p.term} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                  <dt className="font-display text-lg">{p.term}</dt>
                  <dd className="leading-relaxed text-ink-2">{p.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
