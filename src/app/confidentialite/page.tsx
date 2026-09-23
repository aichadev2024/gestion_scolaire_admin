import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

const CONTACT_EMAIL = 'netaa.ecole.mali@gmail.com';
const CONTACT_TEL = '+223 71 91 93 53';
const CONTACT_TEL_HREF = 'tel:+22371919353';
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=Confidentialit%C3%A9%20-%20Netaa%20%C3%89cole`;

const TITLE = 'Politique de confidentialité — Netaa École';
const DESCRIPTION =
  "Quelles données Netaa École collecte, pourquoi, comment elles sont protégées, et comment les faire supprimer.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <Logo className="h-7 w-auto" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Retour au site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Politique de confidentialité</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dernière mise à jour : 23 septembre 2026. S&apos;applique au portail web et à l&apos;application mobile
          Netaa École, utilisés par les établissements scolaires clients et leurs directeurs, personnel,
          enseignants, élèves et parents.
        </p>

        <Section title="Qui est responsable de vos données">
          <p>
            Netaa École est un logiciel fourni à un établissement scolaire, qui reste responsable des données de
            ses élèves, parents et personnel qu&apos;il y saisit. Pour toute question sur vos données, contactez
            en priorité la direction de votre établissement, ou l&apos;équipe Netaa École à{' '}
            <a href={MAILTO} className="font-medium text-foreground underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Données que nous collectons">
          <p>Selon le rôle du compte, l&apos;application traite :</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-foreground">Élève</span> — nom, prénom, date de naissance, photo,
              classe, matricule, notes, présences, incidents disciplinaires, documents pédagogiques.
            </li>
            <li>
              <span className="font-medium text-foreground">Parent / tuteur</span> — nom, numéro de téléphone,
              adresse e-mail, lien avec l&apos;élève, historique des frais de scolarité et des paiements
              enregistrés par l&apos;établissement.
            </li>
            <li>
              <span className="font-medium text-foreground">Personnel (direction, enseignants, surveillant
              général, comptable)</span> — nom, coordonnées, fonction, et les données pédagogiques ou
              administratives qu&apos;ils saisissent dans le cadre de leur travail.
            </li>
            <li>
              <span className="font-medium text-foreground">Technique</span> — identifiant de connexion
              (jeton), et si les notifications sont activées, un identifiant d&apos;appareil (jeton FCM) utilisé
              uniquement pour l&apos;envoi de notifications.
            </li>
          </ul>
          <p>
            Les paiements de frais de scolarité (espèces, Mobile Money) sont enregistrés manuellement par
            l&apos;établissement à titre de suivi comptable — l&apos;application ne traite ni ne stocke aucune
            donnée de carte bancaire, et n&apos;effectue elle-même aucune transaction financière.
          </p>
        </Section>

        <Section title="Pourquoi nous les utilisons">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Assurer le suivi scolaire (notes, bulletins, présences, discipline, emploi du temps).</li>
            <li>Permettre aux parents de suivre la scolarité et les paiements de leur(s) enfant(s).</li>
            <li>Envoyer une notification (absence, retard, incident, nouvelle note) au parent concerné.</li>
            <li>Générer les documents officiels de l&apos;établissement (bulletins, cartes scolaires, reçus).</li>
            <li>Sécuriser les comptes et empêcher les accès non autorisés.</li>
          </ul>
          <p>Nous ne vendons aucune donnée et ne l&apos;utilisons jamais à des fins publicitaires.</p>
        </Section>

        <Section title="Avec qui les données sont partagées">
          <p>
            Les données restent internes à l&apos;établissement scolaire et à son personnel autorisé. Elles ne
            sont partagées qu&apos;avec les prestataires techniques nécessaires au fonctionnement du service,
            chacun agissant uniquement selon nos instructions :
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Hébergement de la base de données et de l&apos;application (infrastructure cloud sécurisée).</li>
            <li>Stockage des photos et documents (Cloudflare R2, accès privé).</li>
            <li>Envoi des notifications (Google Firebase Cloud Messaging).</li>
          </ul>
        </Section>

        <Section title="Combien de temps elles sont gardées">
          <p>
            Les données sont conservées tant que le compte de l&apos;établissement est actif. Un élève archivé
            (parti de l&apos;établissement) n&apos;est plus compté dans les effectifs actifs, mais son dossier
            reste consultable pour l&apos;historique scolaire, sauf demande de suppression. Des sauvegardes
            chiffrées de la base de données sont conservées 35 jours à des fins de continuité de service.
          </p>
        </Section>

        <Section title="Comment elles sont protégées">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Connexion sécurisée (HTTPS) sur l&apos;ensemble du service.</li>
            <li>Mots de passe jamais stockés en clair (chiffrement).</li>
            <li>Chaque compte n&apos;accède qu&apos;aux données de son propre établissement et de son rôle.</li>
            <li>Sauvegardes quotidiennes indépendantes, dans un espace de stockage séparé et privé.</li>
          </ul>
        </Section>

        <Section title="Vos droits">
          <p>
            Vous pouvez demander à consulter, corriger ou faire supprimer les données vous concernant (ou
            concernant votre enfant) en contactant la direction de votre établissement ou l&apos;équipe Netaa
            École à{' '}
            <a href={MAILTO} className="font-medium text-foreground underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            . Un compte peut être désactivé à tout moment à la demande de l&apos;établissement.
          </p>
        </Section>

        <Section title="Nous contacter">
          <div className="flex flex-col gap-2">
            <a href={MAILTO} className="flex items-center gap-2 font-medium text-foreground hover:underline">
              <Mail className="size-4" /> {CONTACT_EMAIL}
            </a>
            <a href={CONTACT_TEL_HREF} className="flex items-center gap-2 font-medium text-foreground hover:underline">
              <Phone className="size-4" /> {CONTACT_TEL}
            </a>
          </div>
        </Section>
      </main>
    </div>
  );
}
