import type { Metadata } from 'next';
import { Inter, Bricolage_Grotesque, Spline_Sans_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', weight: ['600', '700', '800'] });
const splineMono = Spline_Sans_Mono({ subsets: ['latin'], variable: '--font-spline-mono', display: 'swap', weight: ['400', '500'] });

const SITE_URL = 'https://netaa-ecole.com';
const TITLE = 'Netaa École — Gestion scolaire';
const DESCRIPTION =
  "Netaa École — le suivi de la scolarité (notes, présences, bulletins, frais) pour les écoles du Mali, leurs enseignants et les parents d'élèves.";

export const metadata: Metadata = {
  // Base pour résoudre les URLs absolues des images de partage (og:image, twitter:image) —
  // sans elle, Next les publierait en chemin relatif, invalide pour WhatsApp/Facebook/X.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Netaa École',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${bricolage.variable} ${splineMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
