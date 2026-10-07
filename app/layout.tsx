import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E9E9E0' },
    { media: '(prefers-color-scheme: dark)', color: '#15170F' },
  ],
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ASORIA — AI-Powered Architecture Design',
    template: '%s | ASORIA',
  },
  description:
    'Design your dream space with AI. Describe it, build it, walk through it. ASORIA is a fully generative AI-powered architecture design platform for iOS and Android.',
  keywords: [
    'architecture',
    'AI design',
    'floor plan generator',
    'AR room scan',
    '3D walkthrough',
    'building design',
    'ASORIA',
    'Crokora',
  ],
  authors: [{ name: 'Crokora' }],
  openGraph: {
    title: 'ASORIA — AI-Powered Architecture Design',
    description: 'Describe it. Build it. Walk through it.',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://asoria.vercel.app',
    siteName: 'ASORIA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASORIA — AI-Powered Architecture Design',
    description: 'Describe it. Build it. Walk through it.',
    creator: '@asoria_app',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://asoria.vercel.app'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-sheet focus:px-4 focus:py-3 focus:text-ink sh2"
        >
          Skip to content
        </a>
        <div className="paper-grain min-h-screen">
          <Nav />
          <main id="main" className="min-h-screen pt-[72px]">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
