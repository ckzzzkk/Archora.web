import Link from 'next/link';

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="paper-grain relative overflow-hidden rounded-2xl border border-rule bg-sheet px-8 py-14 sm:px-14 sh2">
        <h2 className="font-display max-w-2xl text-3xl sm:text-4xl md:text-5xl">Draft your first building today.</h2>
        <p className="mt-4 max-w-lg text-lg text-ink-2">
          Create your account in the app, then manage your plan here on the web. It is the same sign-in on both.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/pricing" className="btn btn-action">See the plans</Link>
          <Link href="/login" className="btn btn-quiet">Log in</Link>
        </div>
      </div>
    </section>
  );
}
