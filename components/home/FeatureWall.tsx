import Link from 'next/link';

const INTERVIEW = ['Building type', 'Plot size', 'Rooms and extras', 'Style', 'Reference photo', 'Notes or voice', 'Review'];

export default function FeatureWall() {
  return (
    <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-6 py-24">
      <h2 id="features-title" className="font-display max-w-2xl text-3xl sm:text-4xl md:text-5xl">
        Everything you see is generated for you, not picked from a template.
      </h2>

      <div className="mt-12 grid gap-5 md:grid-cols-6">
        {/* Generation: the long one, with the real sequence */}
        <Link href="/features#generation" className="settle group rounded-2xl border border-ai/30 bg-sheet p-7 md:col-span-4 sh1">
          <h3 className="font-display text-2xl text-ai-ink">Seven questions, one plan</h3>
          <p className="mt-2 max-w-md text-ink-2">
            Not a single text box. ARIA interviews you like a designer would, then drafts a plan that fits your plot, your rooms and your style.
          </p>
          <ol className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {INTERVIEW.map((s, i) => (
              <li key={s} className="flex items-baseline gap-3 border-b border-rule-soft pb-2 text-sm">
                <span className="num w-4 text-ink-3">{i + 1}</span>
                <span className="text-ink">{s}</span>
              </li>
            ))}
          </ol>
        </Link>

        <Link href="/features#studio" className="settle rounded-xl border border-rule bg-sheet p-6 md:col-span-2 sh1">
          <h3 className="font-display text-xl">A studio in your hand</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Move walls, resize rooms, swap finishes. Every change is undoable, and shaking your phone does it.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-3">Paid plans save your work automatically, as often as every 30 seconds.</p>
        </Link>

        <Link href="/features#furniture" className="settle rounded-xl border border-rule bg-sheet p-6 md:col-span-2 sh1">
          <p className="num text-4xl font-semibold text-ink">65+</p>
          <h3 className="font-display mt-1 text-xl">Pieces that fit</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Furniture in true size. Photograph a chair or describe a sofa and ASORIA builds it for you on the higher plans.
          </p>
        </Link>

        <Link href="/features#ar" className="settle rounded-xl border border-rule bg-sheet p-6 md:col-span-2 sh1">
          <h3 className="font-display text-xl">Your camera is a tape measure</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
            <li><span className="font-semibold text-ink">Scan</span> a room into a plan</li>
            <li><span className="font-semibold text-ink">Place</span> furniture at true size</li>
            <li><span className="font-semibold text-ink">Measure</span> walls and openings</li>
          </ul>
        </Link>

        <Link href="/features#community" className="settle rounded-xl border border-rule bg-sheet p-6 md:col-span-2 sh1">
          <h3 className="font-display text-xl">Share what you drew</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Browse designs in Inspo, save the ones you love, and publish your own as templates. Creators keep 60% of sales, Architects 70%.
          </p>
        </Link>
      </div>
    </section>
  );
}
