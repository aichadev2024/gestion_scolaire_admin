import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BellRing,
  CalendarDays,
  IdCard,
  ScrollText,
  Wallet,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { Logo, LogoMark } from '@/components/logo';

export const metadata: Metadata = {
  title: 'Netaa École — Le suivi scolaire des écoles du Mali',
  description:
    "Notes, présences, bulletins, frais et carte scolaire — sur le téléphone des parents, en temps réel, en français. Fait au Mali.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <div className="flex items-center gap-6 text-sm">
            <a href="#pour-qui" className="hidden text-muted-foreground hover:text-foreground sm:block">Pour qui</a>
            <a href="#fonctionnalites" className="hidden text-muted-foreground hover:text-foreground sm:block">Fonctionnalités</a>
            <a href="#etapes" className="hidden text-muted-foreground hover:text-foreground sm:block">Comment ça marche</a>
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Connexion
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Héros ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 font-mono text-[0.7rem] font-medium uppercase tracking-[0.15em] text-accent">
              <span className="size-1.5 rounded-full bg-accent" /> Fait au Mali · en français
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-primary sm:text-5xl">
              Suivez la scolarité de votre enfant, où que vous soyez.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Notes, présences, bulletins, cantine et frais — sur votre téléphone, en temps réel.
              Votre école vous ouvre l&apos;accès, vous n&apos;installez rien de compliqué.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Espace parents <ArrowRight className="size-4" />
              </Link>
              <a
                href="#fonctionnalites"
                className="inline-flex items-center rounded-md border border-input px-5 py-3 font-semibold hover:bg-secondary"
              >
                Voir les fonctionnalités
              </a>
            </div>
          </div>
          <HeroScene />
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Pour qui ── */}
      <section id="pour-qui" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Trois métiers, un seul carnet</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Chacun voit ce qui le concerne, avec le même vocabulaire d&apos;une école malienne.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { t: 'Parents & élèves', d: 'Le bulletin, les absences, le reste à payer, l’emploi du temps. Une notification dès qu’il y a du nouveau.' },
            { t: 'Enseignants', d: 'Saisie des notes et de l’appel depuis un téléphone, même hors connexion stable. Les moyennes se calculent seules.' },
            { t: 'Direction & secrétariat', d: 'Inscriptions, classes, frais, reçus PDF, journal d’activité. Plusieurs établissements sur un même compte éditeur.' },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Ce que vous suivez</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: ScrollText, t: 'Notes & bulletins', d: 'Dès que l’enseignant saisit. Moyenne pondérée par coefficient, rang de classe, bulletin PDF.' },
            { Icon: BellRing, t: 'Présences', d: 'Présent, absent, retard — justifié ou non. Une absence, et vous êtes prévenu.' },
            { Icon: Wallet, t: 'Frais & reçus', d: 'Frais par classe, par tranche. Reste à payer clair, reçu PDF à chaque versement.' },
            { Icon: CalendarDays, t: 'Emploi du temps', d: 'La semaine de la classe, pauses comprises. Côté enseignant : ses créneaux.' },
            { Icon: IdCard, t: 'Carte scolaire', d: 'Carte avec QR code, vérifiable par l’établissement. Fini la carte perdue et non rééditée.' },
            { Icon: Building2, t: 'Multi-établissements', d: 'Chaque école ne voit que ses données. Cloisonnement strict entre établissements.' },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Étapes ── */}
      <section id="etapes" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Comment vous y accédez</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['L’école vous inscrit', 'La direction crée le compte de votre enfant et le vôtre. Rien à faire de votre côté.'],
            ['Vous recevez vos identifiants', 'Par SMS ou remis au secrétariat. Mot de passe à changer à la première connexion.'],
            ['Vous suivez en temps réel', 'Connexion sur netaa.ml ou l’application. Tout est là, à jour.'],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <span className="font-mono text-sm font-semibold text-accent">0{i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Bandeau conviction ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl font-display text-xl font-bold leading-snug sm:text-2xl">
            Conçu au Mali, en français, pour le réseau que vous avez — pas pour une connexion parfaite.
          </p>
          <Link
            href="/login"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-[hsl(var(--gold))] px-5 py-3 font-semibold text-[hsl(var(--gold-foreground))] hover:opacity-90"
          >
            Se connecter <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Pied de page ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <LogoMark className="size-6" /> Netaa École — République du Mali
          </span>
          <span>© {new Date().getFullYear()} · Tous droits réservés</span>
        </div>
      </footer>
    </div>
  );
}

/** Illustration vectorielle : un parent et son enfant consultent l'application sous un acacia. */
function HeroScene() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 440 340"
        className="w-full rounded-2xl border border-border bg-card shadow-sm"
        role="img"
        aria-label="Un parent et son enfant consultent Netaa École sous un acacia, au coucher du soleil"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(var(--muted))" />
            <stop offset="1" stopColor="hsl(var(--card))" />
          </linearGradient>
        </defs>
        <rect width="440" height="340" fill="url(#sky)" />
        {/* grille cousue en filigrane */}
        <g stroke="hsl(var(--border))" strokeWidth="1" opacity="0.6">
          <path d="M0 70H440M0 140H440M0 210H440M110 0V340M220 0V340M330 0V340" />
        </g>
        {/* soleil */}
        <circle cx="338" cy="96" r="34" fill="hsl(var(--gold))" opacity="0.9" />
        {/* sol latérite */}
        <rect x="0" y="270" width="440" height="70" fill="hsl(var(--accent))" opacity="0.9" />
        <rect x="0" y="270" width="440" height="8" fill="hsl(var(--accent))" />
        {/* acacia */}
        <path d="M92 272 V170" stroke="#6b4326" strokeWidth="10" strokeLinecap="round" />
        <path d="M92 176 q-34 -14 -58 6 q26 -4 58 4 M92 176 q30 -20 66 -4 q-30 -6 -66 8" fill="#5c7a4b" />
        <ellipse cx="92" cy="150" rx="64" ry="26" fill="#5c7a4b" />
        {/* adulte */}
        <g>
          <circle cx="232" cy="150" r="17" fill="hsl(var(--primary))" />
          <rect x="214" y="168" width="36" height="66" rx="12" fill="hsl(var(--primary))" />
          <rect x="238" y="196" width="34" height="12" rx="6" fill="hsl(var(--primary))" transform="rotate(18 238 196)" />
        </g>
        {/* enfant */}
        <g>
          <circle cx="286" cy="188" r="13" fill="#7a3a2b" />
          <rect x="273" y="202" width="27" height="50" rx="10" fill="#7a3a2b" />
        </g>
        {/* téléphone avec coche */}
        <g>
          <rect x="252" y="188" width="30" height="46" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2.5" />
          <path d="M260 210 l5 5 l10 -12" fill="none" stroke="hsl(var(--success))" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
