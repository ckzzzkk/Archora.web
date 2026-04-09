import type { Metadata } from 'next';
import { Inter, Architects_Daughter, JetBrains_Mono } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const architectsDaughter = Architects_Daughter({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-architects-daughter',
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
    url: 'https://asoria.app',
    siteName: 'ASORIA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASORIA — AI-Powered Architecture Design',
    description: 'Describe it. Build it. Walk through it.',
    creator: '@asoria_app',
  },
  metadataBase: new URL('https://asoria.app'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${architectsDaughter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-background text-text antialiased">
        <Nav />
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
