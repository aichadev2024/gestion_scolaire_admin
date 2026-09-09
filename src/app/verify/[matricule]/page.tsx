'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, ShieldX, TriangleAlert } from 'lucide-react';
import api from '@/services/api';
import { Eleve } from '@/types';
import { Logo } from '@/components/logo';

export default function VerifyPage() {
  const params = useParams();
  const matricule = params?.matricule as string;
  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!matricule) return;
    const verify = async () => {
      try {
        const all = await api.get<Eleve[]>('/eleves');
        const found = all.data.find((e) => e.matricule === matricule);
        if (found) setEleve(found);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [matricule]);

  const isActif = (eleve?.statut || '') === 'ACTIF';

  const rows = [
    { label: 'Nom & prénom', value: `${eleve?.profil?.nom?.toUpperCase() ?? ''} ${eleve?.profil?.prenom ?? ''}`.trim() },
    { label: 'Matricule', value: eleve?.matricule, mono: true },
    { label: 'Classe', value: eleve?.classeNom || 'Non affecté' },
    { label: 'Statut', value: eleve?.statut },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo markClassName="h-14 w-14" showEcole={false} className="[&_span]:text-primary-foreground" />
          <div className="mt-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">
            Vérification de carte scolaire
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-primary-foreground backdrop-blur">
          {loading ? (
            <div className="py-10 text-center text-sm text-primary-foreground/60">
              Vérification en cours…
            </div>
          ) : notFound ? (
            <div className="py-8 text-center">
              <ShieldX className="mx-auto mb-3 size-12 text-destructive" />
              <h2 className="mb-1 text-lg font-bold text-destructive">Carte invalide</h2>
              <p className="text-sm text-primary-foreground/50">
                Aucun élève trouvé avec le matricule <strong className="text-primary-foreground">{matricule}</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-extrabold tracking-wide ${
                    isActif
                      ? 'border-success bg-success/15 text-success'
                      : 'border-destructive bg-destructive/15 text-destructive'
                  }`}
                >
                  {isActif ? <CheckCircle2 className="size-4" /> : <ShieldX className="size-4" />}
                  {isActif ? 'CARTE VALIDE' : 'CARTE EXPIRÉE / ARCHIVÉE'}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                  >
                    <span className="text-xs font-semibold text-primary-foreground/50">{row.label}</span>
                    <span
                      className={`text-sm font-bold ${row.mono ? 'font-mono text-gold' : 'text-primary-foreground'}`}
                    >
                      {row.value || '—'}
                    </span>
                  </div>
                ))}
              </div>

              {!isActif && (
                <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
                  <TriangleAlert className="size-4 shrink-0" />
                  Cette carte n&apos;est plus valide. L&apos;élève n&apos;est plus actif dans le système.
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-primary-foreground/30">
          Netaa École — Gestion scolaire numérique · Vérification automatisée
        </p>
      </div>
    </div>
  );
}
