import Link from 'next/link';
import Mark from './Mark';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Log in', href: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [{ label: 'Contact', href: '/contact' }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of service', href: '/terms' },
    ],
  },
];

const SOCIAL = [
  { label: 'Instagram', href: 'https://www.instagram.com/asoria.app/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@asoria.app' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61589310296162' },
  { label: 'X', href: 'https://x.com/Asoria_app' },
];

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-paper-deep/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 text-ink" aria-label="ASORIA home">
            <Mark size={32} />
            <span className="font-display text-2xl leading-none">ASORIA</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
            Describe a building and ASORIA drafts it: plan, 3D model, furniture and an AR walk-through, on iOS and Android.
          </p>
          <a
            href="mailto:asoria.app@gmail.com"
            className="mt-4 inline-block text-sm font-medium text-structure-ink underline decoration-structure/40 underline-offset-4 hover:decoration-structure"
          >
            asoria.app@gmail.com
          </a>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-display text-base">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-ink-2 transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Crokora. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
