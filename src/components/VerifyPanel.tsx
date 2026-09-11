'use client';

import { CheckCircle2, ShieldX, TriangleAlert } from 'lucide-react';
import { Logo } from '@/components/logo';

export interface VerifyRow {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}

export interface VerifyBadge {
  label: string;
  ok: boolean;
}

interface VerifyPanelProps {
  eyebrow: string;
  loading: boolean;
  valide: boolean;
  code: string;
  notFoundLabel: string;
  badge?: VerifyBadge;
  warning?: string;
  rows: VerifyRow[];
}

/**
 * Panneau public de vérification — même mise en page pour tous les documents
 * (carte scolaire, reçu, bulletin, abonnement établissement) : la donnée
 * affichée ici vient toujours de la base, jamais du document scanné, donc une
 * copie modifiée du papier est détectable par comparaison.
 */
export default function VerifyPanel({ eyebrow, loading, valide, code, notFoundLabel, badge, warning, rows }: VerifyPanelProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo markClassName="h-14 w-14" showEcole={false} className="[&_span]:text-primary-foreground" />
          <div className="mt-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">{eyebrow}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-primary-foreground backdrop-blur">
          {loading ? (
            <div className="py-10 text-center text-sm text-primary-foreground/60">Vérification en cours…</div>
          ) : !valide ? (
            <div className="py-8 text-center">
              <ShieldX className="mx-auto mb-3 size-12 text-destructive" />
              <h2 className="mb-1 text-lg font-bold text-destructive">Document introuvable</h2>
              <p className="text-sm text-primary-foreground/50">
                {notFoundLabel} <strong className="text-primary-foreground">{code}</strong>.
              </p>
            </div>
          ) : (
            <>
              {badge && (
                <div className="mb-6 flex justify-center">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-extrabold tracking-wide ${
                      badge.ok
                        ? 'border-success bg-success/15 text-success'
                        : 'border-destructive bg-destructive/15 text-destructive'
                    }`}
                  >
                    {badge.ok ? <CheckCircle2 className="size-4" /> : <ShieldX className="size-4" />}
                    {badge.label}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-4 py-3">
                    <span className="shrink-0 text-xs font-semibold text-primary-foreground/50">{row.label}</span>
                    <span className={`text-right text-sm font-bold ${row.mono ? 'font-mono text-gold' : 'text-primary-foreground'}`}>
                      {row.value ?? '—'}
                    </span>
                  </div>
                ))}
              </div>

              {warning && (
                <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
                  <TriangleAlert className="size-4 shrink-0" />
                  {warning}
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
