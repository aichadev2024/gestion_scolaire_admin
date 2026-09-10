import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BellRing,
  CalendarDays,
  IdCard,
  ScrollText,
  Wallet,
  Building2,
  Smartphone,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { Logo, LogoMark } from '@/components/logo';

const CONTACT_EMAIL = 'diarrassoubaa505@gmail.com';
const CONTACT_TEL = '+223 71 91 93 53';
const CONTACT_TEL_HREF = 'tel:+22371919353';
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=Demande%20de%20d%C3%A9mo%20Netaa%20%C3%89cole`;

export const metadata: Metadata = {
  title: 'Netaa École — Le logiciel de gestion des écoles du Mali',
  description:
    "Inscriptions, notes & bulletins, finances et cartes scolaires pour votre établissement — avec l'application parents incluse. Conçu au Mali, en français.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <div className="flex items-center gap-6 text-sm">
            <a href="#fonctionnalites" className="hidden text-muted-foreground hover:text-foreground sm:block">Fonctionnalités</a>
            <a href="#roles" className="hidden text-muted-foreground hover:text-foreground sm:block">Pour votre école</a>
            <a href="#tarifs" className="hidden text-muted-foreground hover:text-foreground sm:block">Tarifs</a>
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Connexion direction
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Héros ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 font-mono text-[0.7rem] font-medium uppercase tracking-[0.15em] text-accent">
              <span className="size-1.5 rounded-full bg-accent" /> Conçu au Mali · pour les écoles maliennes
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-primary sm:text-5xl">
              Gérez tout votre établissement, d&apos;une seule application.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Inscriptions, notes et bulletins conformes au système malien, frais et recouvrement,
              cartes scolaires. Et vos parents suivent la scolarité sur leur téléphone — sans que
              votre secrétariat ne réponde au téléphone toute la journée.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Connexion direction <ArrowRight className="size-4" />
              </Link>
              <a
                href={MAILTO}
                className="inline-flex items-center rounded-md border border-input px-5 py-3 font-semibold hover:bg-secondary"
              >
                Demander une démo
              </a>
            </div>
            <p className="mt-4 font-mono text-[0.72rem] text-muted-foreground">
              Un abonnement par établissement · sans limite d&apos;élèves · mise en route accompagnée
            </p>
          </div>
          <HeroScene />
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Pour votre école (rôles) ── */}
      <section id="roles" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Chaque poste de l&apos;école, au bon endroit</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Un seul compte pour l&apos;établissement, des accès séparés par métier — avec le vocabulaire d&apos;une école malienne.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Direction / Censeur', d: 'Vue d’ensemble : effectifs, classes, impayés, bulletins à valider. Verrouillage des bulletins en conseil de classe.' },
            { t: 'Secrétariat', d: 'Inscriptions et dossiers élèves, affectation aux classes, emplois du temps, édition des cartes scolaires en lot.' },
            { t: 'Comptabilité', d: 'Frais par classe et par tranche, encaissements, reçus PDF, suivi du reste à payer élève par élève.' },
            { t: 'Enseignants', d: 'Saisie des notes et de l’appel depuis un téléphone. Les moyennes et les rangs se calculent seuls.' },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] p-5">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Les parents et les élèves ont leur propre application.</span>{' '}
            Notes, absences, reste à payer et carte scolaire sur leur téléphone — l&apos;établissement ouvre l&apos;accès, rien à installer.
          </p>
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Ce que l&apos;établissement pilote</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: Building2, t: 'Inscriptions & dossiers', d: 'Élèves, parents, affectation aux classes, statut (inscrit, archivé). Matricule généré automatiquement.' },
            { Icon: ScrollText, t: 'Notes & bulletins', d: 'Compositions et trimestres, moyennes pondérées par coefficient, rang de classe, bulletin PDF officiel — verrouillable.' },
            { Icon: Wallet, t: 'Finances & recouvrement', d: 'Frais par classe et par tranche, encaissements, reçu PDF, tableau du reste à payer par élève et par classe.' },
            { Icon: CalendarDays, t: 'Emplois du temps', d: 'La semaine de chaque classe, pauses comprises. Chaque enseignant retrouve ses créneaux.' },
            { Icon: IdCard, t: 'Cartes scolaires', d: 'Génération par classe, QR code vérifiable, export PDF et impression en lot. Fini la carte perdue non rééditée.' },
            { Icon: BellRing, t: 'Présences', d: 'Appel par cours, retards et absences justifiées ou non. Le parent est prévenu automatiquement.' },
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

      {/* ── Mise en place ── */}
      <section id="etapes" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">La mise en route</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['On crée votre établissement', 'Nous ouvrons votre espace et le compte de la direction. Vos données restent cloisonnées de toute autre école.'],
            ['Vous chargez classes & élèves', 'Le secrétariat saisit (ou nous vous aidons à importer) les classes, les élèves et les frais de l’année.'],
            ['Vous ouvrez les accès', 'Comptes enseignants créés en quelques minutes. Les parents reçoivent leurs identifiants pour l’application.'],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <span className="font-mono text-sm font-semibold text-accent">0{i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Tarifs / contact ── */}
      <section id="tarifs" className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Un abonnement par établissement</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Sans limite d&apos;élèves ni de comptes. L&apos;application parents, les bulletins PDF et les cartes
            scolaires sont inclus. Le tarif dépend de la taille de l&apos;école et du niveau d&apos;accompagnement
            au démarrage.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Pour une démonstration ou un devis, contactez l&apos;équipe Netaa École.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={MAILTO}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Mail className="size-4" /> {CONTACT_EMAIL}
            </a>
            <a
              href={CONTACT_TEL_HREF}
              className="inline-flex items-center gap-2 rounded-md border border-input px-5 py-3 font-semibold hover:bg-secondary"
            >
              <Phone className="size-4" /> {CONTACT_TEL}
            </a>
          </div>
          <div className="mt-4">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              J&apos;ai déjà un compte <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bandeau conviction ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl font-display text-xl font-bold leading-snug sm:text-2xl">
            Conçu au Mali, en français, pour le réseau que vous avez — pas pour une connexion parfaite.
          </p>
          <a
            href={MAILTO}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-[hsl(var(--gold))] px-5 py-3 font-semibold text-[hsl(var(--gold-foreground))] hover:opacity-90"
          >
            Parler à l&apos;équipe <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ── Pied de page ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <LogoMark className="size-6" /> Netaa École — République du Mali
          </span>
          <div className="flex flex-col gap-1 sm:items-end">
            <a href={MAILTO} className="flex items-center gap-1.5 hover:text-foreground">
              <Mail className="size-3.5" /> {CONTACT_EMAIL}
            </a>
            <a href={CONTACT_TEL_HREF} className="flex items-center gap-1.5 hover:text-foreground">
              <Phone className="size-3.5" /> {CONTACT_TEL}
            </a>
            <span className="mt-1">© {new Date().getFullYear()} · Tous droits réservés</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Illustration vectorielle : le bâtiment de l'école et le tableau de bord Netaa. */
function HeroScene() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 440 340"
        className="w-full rounded-2xl border border-border bg-card shadow-sm"
        role="img"
        aria-label="Le bâtiment d'une école malienne et le tableau de bord Netaa École"
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
        <circle cx="356" cy="70" r="30" fill="hsl(var(--gold))" opacity="0.9" />
        {/* sol latérite */}
        <rect x="0" y="270" width="440" height="70" fill="hsl(var(--accent))" opacity="0.9" />
        <rect x="0" y="270" width="440" height="8" fill="hsl(var(--accent))" />

        {/* bâtiment de l'école */}
        <g>
          <rect x="44" y="150" width="150" height="120" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="3" />
          {/* toit */}
          <path d="M36 150 L119 110 L202 150 Z" fill="hsl(var(--primary))" />
          {/* porte */}
          <rect x="104" y="214" width="30" height="56" rx="3" fill="hsl(var(--primary))" />
          {/* fenêtres */}
          <g fill="hsl(var(--primary))" opacity="0.35">
            <rect x="60" y="172" width="26" height="24" />
            <rect x="152" y="172" width="26" height="24" />
            <rect x="60" y="214" width="26" height="24" />
            <rect x="152" y="214" width="26" height="24" />
          </g>
          {/* mât + drapeau */}
          <path d="M119 110 V70" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
          <path d="M119 72 h26 v16 h-26 z" fill="hsl(var(--success))" />
        </g>

        {/* carte tableau de bord */}
        <g>
          <rect x="234" y="150" width="168" height="112" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2.5" />
          <rect x="234" y="150" width="168" height="24" rx="10" fill="hsl(var(--primary))" opacity="0.12" />
          <circle cx="248" cy="162" r="3.5" fill="hsl(var(--accent))" />
          <rect x="258" y="159" width="70" height="6" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.5" />
          {/* barres */}
          <g fill="hsl(var(--primary))">
            <rect x="250" y="222" width="18" height="24" rx="2" />
            <rect x="278" y="210" width="18" height="36" rx="2" />
            <rect x="306" y="198" width="18" height="48" rx="2" />
            <rect x="334" y="214" width="18" height="32" rx="2" />
            <rect x="362" y="190" width="18" height="56" rx="2" />
          </g>
          {/* ligne de base */}
          <path d="M244 246 H392" stroke="hsl(var(--border))" strokeWidth="1.5" />
          {/* coche */}
          <path d="M250 190 l6 6 l12 -14" fill="none" stroke="hsl(var(--success))" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
