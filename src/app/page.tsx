import type { Metadata } from 'next';
import Image from 'next/image';
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
  ShieldCheck,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { Logo, LogoMark } from '@/components/logo';

const CONTACT_EMAIL = 'netaa.ecole.mali@gmail.com';
const CONTACT_TEL = '+223 71 91 93 53';
const CONTACT_TEL_HREF = 'tel:+22371919353';
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=Demande%20de%20d%C3%A9mo%20Netaa%20%C3%89cole`;

const TITLE = 'Netaa École — Le logiciel de gestion des écoles du Mali';
const DESCRIPTION =
  "Inscriptions, notes & bulletins, finances et cartes scolaires pour votre établissement — avec l'application parents incluse. Conçu au Mali, en français.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // openGraph/twitter repris ici (pas seulement dans layout.tsx) pour que la carte de partage
  // affichée sur WhatsApp/Facebook/X reprenne bien le titre et la description de CETTE page.
  openGraph: { title: TITLE, description: DESCRIPTION },
  // Next remplace l'objet `twitter` du layout parent plutôt que de le fusionner : le
  // `card: 'summary_large_image'` doit donc être répété ici, sinon il retombe sur le défaut.
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const ROLES = [
  { t: 'Direction / Censeur', d: 'Vue d’ensemble : effectifs, classes, impayés, bulletins à valider. Verrouillage des bulletins en conseil de classe.' },
  { t: 'Secrétariat', d: 'Inscriptions et dossiers élèves, affectation aux classes, emplois du temps, édition des cartes scolaires en lot.' },
  { t: 'Comptabilité', d: 'Frais par classe et par tranche, encaissements, reçus PDF, suivi du reste à payer élève par élève.' },
  { t: 'Enseignants', d: 'Saisie des notes et de l’appel depuis un téléphone. Les moyennes et les rangs se calculent seuls.' },
];

const FONCTIONS = [
  { Icon: Building2, t: 'Inscriptions & dossiers', d: 'Élèves, parents, affectation aux classes, statut (inscrit, archivé). Matricule généré automatiquement.' },
  { Icon: ScrollText, t: 'Notes & bulletins', d: 'Compositions et trimestres, moyennes pondérées par coefficient, rang de classe, bulletin PDF officiel — verrouillable.' },
  { Icon: Wallet, t: 'Finances & recouvrement', d: 'Frais par classe et par tranche, encaissements, reçu PDF, tableau du reste à payer par élève et par classe.' },
  { Icon: CalendarDays, t: 'Emplois du temps', d: 'La semaine de chaque classe, pauses comprises. Chaque enseignant retrouve ses créneaux.' },
  { Icon: IdCard, t: 'Cartes scolaires', d: 'Génération par classe, QR code vérifiable, export PDF et impression en lot. Fini la carte perdue non rééditée.' },
  { Icon: BellRing, t: 'Présences', d: 'Appel par cours, retards et absences justifiées ou non. Le parent est prévenu automatiquement.' },
];

const ETAPES = [
  ['On crée votre établissement', 'Nous ouvrons votre espace et le compte de la direction. Vos données restent cloisonnées de toute autre école.'],
  ['Vous chargez classes & élèves', 'Le secrétariat saisit (ou nous vous aidons à importer) les classes, les élèves et les frais de l’année.'],
  ['Vous ouvrez les accès', 'Comptes enseignants créés en quelques minutes. Les parents reçoivent leurs identifiants pour l’application.'],
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <div className="flex items-center gap-7 text-sm">
            <a href="#fonctionnalites" className="hidden font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Fonctionnalités</a>
            <a href="#roles" className="hidden font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Pour votre école</a>
            <a href="#tarifs" className="hidden font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Tarifs</a>
            <Link
              href="/login"
              className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25"
            >
              Connexion direction
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Héros ── */}
      <section className="hero-glow relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.15em] text-accent">
              <span className="size-1.5 rounded-full bg-accent" /> Conçu au Mali · pour les écoles maliennes
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-primary sm:text-5xl lg:text-[3.25rem]">
              Gérez tout votre établissement,{' '}
              <span className="relative inline-block">
                d&apos;une seule application.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full text-accent/60"
                  viewBox="0 0 300 10"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M2,7 C60,2 240,2 298,7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Inscriptions, notes et bulletins conformes au système malien, frais et recouvrement,
              cartes scolaires. Et vos parents suivent la scolarité sur leur téléphone — sans que
              votre secrétariat ne réponde au téléphone toute la journée.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Connexion direction <ArrowRight className="size-4" />
              </Link>
              <a
                href={MAILTO}
                className="inline-flex items-center rounded-full border border-input bg-card px-6 py-3.5 font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary"
              >
                Demander une démo
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.72rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary/70" /> données cloisonnées par établissement
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary/70" /> sans limite d&apos;élèves
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl" aria-hidden="true" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-border shadow-2xl shadow-primary/10">
              <Image
                src="/photos/cours.jpg"
                alt="Un enseignant anime son cours devant sa classe"
                fill
                priority
                sizes="(min-width: 768px) 560px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/25 via-transparent to-transparent" aria-hidden="true" />
            </div>
            <div className="absolute -right-3 -top-3 hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-primary shadow-md sm:flex">
              <GraduationCap className="size-4" /> Général & technique
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:left-8">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BellRing className="size-5" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold text-foreground">Le parent est prévenu</span>
                <span className="block text-xs text-muted-foreground">absence, note, devoirs, paiement</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Pour votre école (rôles) ── */}
      <section id="roles" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Chaque poste de l&apos;école, au bon endroit</h2>
        <p className="mt-2.5 max-w-xl text-muted-foreground">
          Un seul compte pour l&apos;établissement, des accès séparés par métier — avec le vocabulaire d&apos;une école malienne.
        </p>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((c) => (
            <div key={c.t} className="card-lift rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold">{c.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] p-5 sm:p-6">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="size-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Les parents et les élèves ont leur propre application.</span>{' '}
            Notes, absences, reste à payer et carte scolaire sur leur téléphone — l&apos;établissement ouvre l&apos;accès, rien à installer.
          </p>
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Toute la communauté scolaire ── */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative order-2 md:order-1">
            <div className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-gradient-to-tr from-accent/12 via-gold/10 to-transparent blur-xl" aria-hidden="true" />
            <div className="relative aspect-[3/2] overflow-hidden rounded-[1.5rem] border border-border shadow-xl shadow-primary/10">
              <Image
                src="/photos/communaute.jpg"
                alt="Groupe d'élèves souriantes, cahiers à la main, dans la cour de l'école"
                fill
                sizes="(min-width: 768px) 560px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Toute l&apos;école connectée, du directeur à l&apos;élève</h2>
            <ul className="mt-7 space-y-5 text-sm text-muted-foreground">
              {[
                ['Les enseignants', 'font l’appel, saisissent les notes et tiennent leur cahier de texte depuis leur téléphone.'],
                ['Les parents', 'voient les notes, les absences, les devoirs à faire et les reçus de paiement, avec une notification à chaque nouveauté.'],
                ['Les élèves', 'retrouvent leur emploi du temps, leurs bulletins et leurs devoirs.'],
              ].map(([who, what]) => (
                <li key={who} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span className="leading-relaxed"><span className="font-semibold text-foreground">{who}</span> {what}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Ce que l&apos;établissement pilote</h2>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FONCTIONS.map(({ Icon, t, d }) => (
            <div key={t} className="card-lift rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/30">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Mise en place ── */}
      <section id="etapes" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">La mise en route</h2>
        <ol className="mt-9 grid gap-5 md:grid-cols-3">
          {ETAPES.map(([t, d], i) => (
            <li key={t} className="card-lift relative rounded-2xl border border-border bg-card p-6 pt-7 shadow-sm">
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 font-mono text-sm font-bold text-accent-foreground shadow-sm shadow-accent/30">
                {i + 1}
              </span>
              <h3 className="mt-3.5 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mudcloth-divider" aria-hidden="true" />

      {/* ── Tarifs / contact ── */}
      <section id="tarifs" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.04] p-8 shadow-xl shadow-primary/5 sm:p-11">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <h2 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">Un abonnement par établissement</h2>
            <p className="mt-3.5 max-w-2xl leading-relaxed text-muted-foreground">
              Sans limite d&apos;élèves ni de comptes. L&apos;application parents, les bulletins PDF et les cartes
              scolaires sont inclus. Le tarif dépend de la taille de l&apos;école et du niveau d&apos;accompagnement
              au démarrage.
            </p>
            <p className="mt-7 text-sm text-muted-foreground">
              Pour une démonstration ou un devis, contactez l&apos;équipe Netaa École.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={MAILTO}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
              >
                <Mail className="size-4" /> {CONTACT_EMAIL}
              </a>
              <a
                href={CONTACT_TEL_HREF}
                className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-6 py-3.5 font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary"
              >
                <Phone className="size-4" /> {CONTACT_TEL}
              </a>
            </div>
            <div className="mt-5">
              <Link href="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                J&apos;ai déjà un compte <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bandeau conviction ── */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <Image src="/photos/bandeau.jpg" alt="" fill sizes="100vw" className="object-cover opacity-[0.16] mix-blend-luminosity" />
        <div className="grain-overlay absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-5 py-14 sm:py-16 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl font-display text-xl font-bold leading-snug sm:text-2xl">
            Conçu au Mali, en français, pour le réseau que vous avez — pas pour une connexion parfaite.
          </p>
          <a
            href={MAILTO}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[hsl(var(--gold))] px-6 py-3.5 font-semibold text-[hsl(var(--gold-foreground))] shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:opacity-90"
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
            <a href={MAILTO} className="flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Mail className="size-3.5" /> {CONTACT_EMAIL}
            </a>
            <a href={CONTACT_TEL_HREF} className="flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Phone className="size-3.5" /> {CONTACT_TEL}
            </a>
            <Link href="/confidentialite" className="mt-1 transition-colors hover:text-foreground">
              Politique de confidentialité
            </Link>
            <span>© {new Date().getFullYear()} · Tous droits réservés</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
