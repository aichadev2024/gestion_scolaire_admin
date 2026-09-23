'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileCheck2, FileText, Download, CheckCircle2, XCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { sujetDevoirService, SujetDevoir, StatutSujet } from '@/services/sujetDevoir.service';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const STATUT_LABEL: Record<StatutSujet, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
};
const STATUT_VARIANT: Record<StatutSujet, 'warning' | 'success' | 'destructive'> = {
  EN_ATTENTE: 'warning',
  VALIDE: 'success',
  REJETE: 'destructive',
};
const TYPE_LABEL = { DEVOIR: 'Devoir', EXAMEN: 'Examen' } as const;

const fmtDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const fmtPoids = (octets?: number | null) => {
  if (!octets) return '';
  const ko = octets / 1024;
  return ko < 1024 ? `${Math.round(ko)} Ko` : `${(ko / 1024).toFixed(1)} Mo`;
};

export default function SujetsDevoirsPage() {
  const [role, setRole] = useState('');
  const [sujets, setSujets] = useState<SujetDevoir[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<StatutSujet | ''>('EN_ATTENTE');
  const [aTraiter, setATraiter] = useState<{ sujet: SujetDevoir; decision: 'VALIDE' | 'REJETE' } | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const peutTraiter = role === 'DIRECTEUR';

  useEffect(() => {
    setRole(authService.getCurrentUser()?.role || '');
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setSujets(await sujetDevoirService.lister(filtre || undefined));
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de charger les sujets.'));
    } finally {
      setLoading(false);
    }
  }, [filtre]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrirTraitement = (sujet: SujetDevoir, decision: 'VALIDE' | 'REJETE') => {
    setATraiter({ sujet, decision });
    setCommentaire('');
  };

  const confirmerTraitement = async () => {
    if (!aTraiter) return;
    setSubmitting(true);
    try {
      await sujetDevoirService.traiter(aTraiter.sujet.id, aTraiter.decision, commentaire.trim() || undefined);
      toast.success(aTraiter.decision === 'VALIDE' ? 'Sujet validé.' : 'Sujet rejeté.');
      setATraiter(null);
      await charger();
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de traiter ce sujet.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sujets de devoirs & examens"
        description="Les sujets envoyés par les enseignants, à valider avant qu'ils soient donnés aux élèves."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Field label="Statut" className="min-w-56">
          <Select value={filtre} onChange={(e) => setFiltre(e.target.value as StatutSujet | '')}>
            <option value="">— Tous —</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validés</option>
            <option value="REJETE">Rejetés</option>
          </Select>
        </Field>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : sujets.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 />}
          title="Aucun sujet"
          description="Les sujets envoyés par les enseignants depuis leur téléphone apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {sujets.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{TYPE_LABEL[s.type]}</Badge>
                    <span className="font-semibold">{s.titre}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.classeNom} — {s.matiereNom} • {s.enseignantNom} • {fmtDate(s.dateEnvoi)}
                  </div>
                </div>
                <Badge variant={STATUT_VARIANT[s.statut]}>{STATUT_LABEL[s.statut]}</Badge>
              </div>

              {s.description && <p className="mt-3 whitespace-pre-line text-sm">{s.description}</p>}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <FileText className="size-4" /> Voir le fichier
                  {s.tailleOctets ? <span className="text-xs text-muted-foreground">({fmtPoids(s.tailleOctets)})</span> : null}
                  <Download className="size-3.5" />
                </a>

                {peutTraiter && s.statut === 'EN_ATTENTE' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => ouvrirTraitement(s, 'REJETE')}>
                      <XCircle /> Rejeter
                    </Button>
                    <Button size="sm" onClick={() => ouvrirTraitement(s, 'VALIDE')}>
                      <CheckCircle2 /> Valider
                    </Button>
                  </div>
                )}
              </div>

              {s.statut !== 'EN_ATTENTE' && s.commentaireDirection && (
                <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                  <strong>{s.traitePar ? `${s.traitePar} — ` : ''}Commentaire :</strong> {s.commentaireDirection}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={aTraiter !== null} onOpenChange={(open) => !open && setATraiter(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {aTraiter?.decision === 'VALIDE' ? 'Valider' : 'Rejeter'} « {aTraiter?.sujet.titre} »
            </DialogTitle>
          </DialogHeader>
          <Field label="Commentaire pour l'enseignant (facultatif)">
            <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setATraiter(null)}>Annuler</Button>
            <Button onClick={confirmerTraitement} loading={submitting}>
              Confirmer {aTraiter?.decision === 'VALIDE' ? 'la validation' : 'le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
