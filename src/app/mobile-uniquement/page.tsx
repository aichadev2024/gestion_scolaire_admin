'use client';

import Link from 'next/link';
import { Smartphone, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/logo';

const MOBILE_APP_URL = 'https://gestion-scolaire-mobile.vercel.app';

/**
 * Élèves et parents n'ont pas accès à l'interface web — ils utilisent
 * l'application mobile. Affichée quand un compte ELEVE/PARENT tente de se
 * connecter ici, ou tombe sur une page qui ne lui est pas destinée.
 */
export default function MobileUniquementPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <Logo className="mb-4" markClassName="h-14 w-14" showEcole={false} />
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Smartphone className="size-7" />
          </span>
        </div>

        <h1 className="font-display text-xl font-extrabold text-foreground">
          Cet espace est réservé à l&apos;équipe pédagogique
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Élèves et parents suivent la scolarité depuis l&apos;<strong className="text-foreground">application
          mobile Netaa École</strong> — notes, présences, bulletins, cartes scolaires et paiements y sont
          accessibles à tout moment, depuis un téléphone.
        </p>

        <a
          href={MOBILE_APP_URL}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Ouvrir l&apos;application mobile <ArrowRight className="size-4" />
        </a>

        <Link href="/login" className="mt-4 inline-block text-xs font-semibold text-muted-foreground hover:text-foreground">
          Se connecter avec un autre compte
        </Link>
      </div>
    </div>
  );
}
