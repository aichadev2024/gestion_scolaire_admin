import type { Metadata } from 'next';
import { Inter, Bricolage_Grotesque, Spline_Sans_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', weight: ['600', '700', '800'] });
const splineMono = Spline_Sans_Mono({ subsets: ['latin'], variable: '--font-spline-mono', display: 'swap', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'Netaa École — Gestion scolaire',
  description:
    "Netaa École — le suivi de la scolarité (notes, présences, bulletins, frais) pour les écoles du Mali, leurs enseignants et les parents d'élèves.",
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
