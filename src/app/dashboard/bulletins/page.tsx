'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Lock, Search, Settings2 } from 'lucide-react';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { bulletinService } from '@/services/bulletin.service';
import { authService } from '@/services/auth.service';
import { Classe, Eleve, Bulletin } from '@/types';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/form-field';

function categoriePourClasse(c?: Classe): 'LYCEE' | 'COLLEGE' | 'PRIMAIRE' | 'MATERNELLE' | 'ALL' {
  if (!c) return 'ALL';
  const t = `${c.niveauNom || ''} ${c.nom || ''}`.toLowerCase();
  if (/lyc[ée]e|10è|11è|12è|term|2nde|1ère s|1ère l|ts[esco]/.test(t)) return 'LYCEE';
  if (/coll[èe]ge|6è|7è|8è|9è/.test(t)) return 'COLLEGE';
  if (/maternelle|petite|moyenne|grande/.test(t)) return 'MATERNELLE';
  if (/primaire|cp|ce1|ce2|cm1|cm2|[1-6](ère|ème) a/.test(t)) return 'PRIMAIRE';
  return 'ALL';
}

const PERIODE_LABEL: Record<string, string> = {
  COMPOSITION_1: 'Composition n°1',
  COMPOSITION_2: 'Composition n°2',
  COMPOSITION_3: 'Composition n°3',
  COMPOSITION_4: 'Composition n°4',
  COMPOSITION_5: 'Composition n°5',
  COMPOSITION_6: 'Composition n°6',
  TRIMESTRE_1: '1er trimestre',
  TRIMESTRE_2: '2e trimestre',
  TRIMESTRE_3: '3e trimestre',
  SEMESTRE_1: '1er semestre',
  SEMESTRE_2: '2e semestre',
};
const formatPeriode = (p: string) => PERIODE_LABEL[p] ?? p?.replace('_', ' ') ?? '';

export default function BulletinsPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [selectedEleveId, setSelectedEleveId] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('TRIMESTRE_1');

  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const anneeScolaire = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const bulletinRef = useRef<HTMLDivElement>(null);

  const role = authService.getCurrentUser()?.role || '';
  const canLock = role === 'ADMIN' || role === 'DIRECTEUR';
  const currentCategory = categoriePourClasse(classes.find((c) => String(c.id) === selectedClasseId));

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user?.etablissementNom) setNomEtablissement(user.etablissementNom);
    classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
  }, []);

  useEffect(() => {
    if (!selectedClasseId) {
      setEleves([]);
      setBulletin(null);
      return;
    }
    eleveService
      .getEleves()
      .then((res) =>
        setEleves(
          res.filter(
            (e) => String(e.classeId) === selectedClasseId && (!e.statut || e.statut.toUpperCase() === 'ACTIF'),
          ),
        ),
      )
      .catch(() => toast.error('Impossible de charger les élèves.'));
    setSelectedEleveId('');
    setBulletin(null);
    const cat = categoriePourClasse(classes.find((c) => String(c.id) === selectedClasseId));
    setSelectedPeriode(cat === 'LYCEE' ? 'TRIMESTRE_1' : 'COMPOSITION_1');
  }, [selectedClasseId, classes]);

  const loadBulletin = async (generate = false) => {
    if (!selectedEleveId) return;
    setLoading(true);
    setBulletin(null);
    try {
      if (generate) {
        setBulletin(await bulletinService.genererBulletin(Number(selectedEleveId), selectedPeriode, anneeScolaire));
        toast.success('Bulletin généré.');
      } else {
        const res = await bulletinService.getBulletinDetails(Number(selectedEleveId), selectedPeriode, anneeScolaire);
        if (res && res.id) setBulletin(res);
        else toast.info('Aucun bulletin pour cette période — cliquez sur « Générer ».');
      }
    } catch (e) {
      toast.error(errorMessage(e, 'Erreur lors du traitement du bulletin.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (!bulletin?.id) return;
    if (!confirm('Verrouiller ce bulletin ? Les notes de cette période ne pourront plus être modifiées.')) return;
    setLoading(true);
    try {
      setBulletin(await bulletinService.verrouillerBulletin(bulletin.id));
      toast.success('Bulletin verrouillé.');
    } catch (e) {
      toast.error(errorMessage(e, 'Erreur lors du verrouillage.'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!bulletin || !bulletinRef.current) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(bulletinRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`bulletin_${bulletin.eleveMatricule}_${selectedPeriode}.pdf`);
    } catch {
      toast.error('Erreur lors de la génération du PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Bulletins scolaires" description="Consultez, générez et imprimez les bulletins par période." />

      <Card className="mb-6 flex flex-wrap items-end gap-4 p-4">
        <div className="flex min-w-56 items-center gap-3 rounded-lg bg-primary/5 px-3 py-2">
          <FileText className="size-5 shrink-0 text-primary" />
          <div>
            <div className="font-mono text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Établissement
            </div>
            <div className="text-sm font-semibold text-primary">
              {nomEtablissement || authService.getCurrentUser()?.etablissementNom || 'Établissement scolaire'}
            </div>
          </div>
        </div>
        <Field label="Classe" className="min-w-40 flex-1">
          <Select value={selectedClasseId} onChange={(e) => setSelectedClasseId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </Select>
        </Field>
        <Field label="Élève" className="min-w-48 flex-1">
          <Select
            value={selectedEleveId}
            onChange={(e) => {
              setSelectedEleveId(e.target.value);
              setBulletin(null);
            }}
            disabled={!selectedClasseId}
          >
            <option value="">— Sélectionner —</option>
            {eleves.map((e) => (
              <option key={e.id} value={e.id}>{e.profil.nom} {e.profil.prenom} ({e.matricule})</option>
            ))}
          </Select>
        </Field>
        <Field label="Période" className="min-w-44 flex-1">
          <Select
            value={selectedPeriode}
            onChange={(e) => {
              setSelectedPeriode(e.target.value);
              setBulletin(null);
            }}
          >
            {['PRIMAIRE', 'MATERNELLE', 'COLLEGE', 'ALL'].includes(currentCategory) && (
              <optgroup label="Compositions">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={`COMPOSITION_${n}`}>Composition n°{n}</option>
                ))}
              </optgroup>
            )}
            {['LYCEE', 'COLLEGE', 'ALL'].includes(currentCategory) && (
              <optgroup label="Trimestres">
                <option value="TRIMESTRE_1">1er trimestre</option>
                <option value="TRIMESTRE_2">2e trimestre</option>
                <option value="TRIMESTRE_3">3e trimestre</option>
              </optgroup>
            )}
          </Select>
        </Field>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!selectedEleveId || loading} onClick={() => loadBulletin(false)}>
            <Search /> Consulter
          </Button>
          <Button disabled={!selectedEleveId || loading} loading={loading} onClick={() => loadBulletin(true)}>
            <Settings2 /> Générer
          </Button>
        </div>
      </Card>

      {!bulletin ? (
        <EmptyState
          icon={<FileText />}
          title="Aucun bulletin affiché"
          description="Choisissez une classe, un élève et une période, puis consultez ou générez le bulletin."
        />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Document imprimable — mise en page officielle conservée */}
          <div className="flex-1 overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
            <div ref={bulletinRef} style={{ padding: '40px', minWidth: '800px', fontFamily: 'serif', color: '#000', backgroundColor: '#ffffff', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '15px', fontSize: '11px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RÉPUBLIQUE DU MALI</div>
                  <div style={{ fontStyle: 'italic', color: '#555' }}>Un Peuple - Un But - Une Foi</div>
                  <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>MINISTÈRE DE L&apos;ÉDUCATION NATIONALE DU MALI</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#1B365D' }}>BULLETIN OFFICIEL DE NOTES</div>
                  <div style={{ fontSize: '11px', color: '#333', fontWeight: 600 }}>ANNÉE SCOLAIRE {bulletin.anneeScolaire}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #1B365D', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Logo établissement" style={{ height: '75px', width: 'auto', objectFit: 'contain' }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1B365D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {(nomEtablissement || authService.getCurrentUser()?.etablissementNom || 'ÉTABLISSEMENT SCOLAIRE').toUpperCase()}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#d97706', fontWeight: 700 }}>
                      Enseignement général, technique &amp; professionnel
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(27,54,93,0.04)', padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(27,54,93,0.15)' }}>
                  <h1 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800 }}>BULLETIN DE NOTES</h1>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 700, color: '#d97706' }}>{formatPeriode(bulletin.periode)}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', padding: '14px 20px', border: '1px solid #1B365D', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                <div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px' }}><strong>Nom &amp; prénom(s) :</strong> <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B365D' }}>{bulletin.eleveNom.toUpperCase()} {bulletin.elevePrenom}</span></p>
                  <p style={{ margin: 0, fontSize: '13px' }}><strong>Matricule :</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#d97706' }}>{bulletin.eleveMatricule}</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px' }}><strong>Classe :</strong> <span style={{ fontWeight: 'bold', color: '#1B365D' }}>{bulletin.classeNom}</span></p>
                  <p style={{ margin: 0, fontSize: '13px' }}><strong>Statut :</strong> <span style={{ color: '#047857', fontWeight: 600 }}>Inscrit / régulier</span></p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', background: '#f5f5f5', width: '30%' }}>Matières</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', background: '#f5f5f5', width: '10%' }}>Coef.</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', background: '#f5f5f5', width: '15%' }}>Moyenne / 20</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', background: '#f5f5f5' }}>Détail des notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.lignes.map((l) => (
                    <tr key={l.classeMatiereId}>
                      <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{l.matiereNom}</td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{l.coefficient}</td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: l.moyenneEleve < 10 ? '#d32f2f' : '#000' }}>
                        {l.moyenneEleve > 0 ? l.moyenneEleve.toFixed(2) : '-'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                        {l.notes.length > 0 ? l.notes.map((n) => `${n.valeur}/${n.noteMax}`).join(', ') : 'Aucune note'}
                      </td>
                    </tr>
                  ))}
                  {bulletin.lignes.length === 0 && (
                    <tr><td colSpan={4} style={{ border: '1px solid #000', padding: '20px', textAlign: 'center' }}>Aucune matière enregistrée.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={2} style={{ border: '1px solid #000', padding: '12px', textAlign: 'right', background: '#e0e0e0', fontSize: '16px' }}>MOYENNE GÉNÉRALE</th>
                    <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', background: '#e0e0e0', fontSize: '16px', color: (bulletin.moyenneGenerale || 0) < 10 ? '#d32f2f' : '#000' }}>
                      {bulletin.moyenneGenerale ? bulletin.moyenneGenerale.toFixed(2) : '-'} / 20
                    </th>
                    <th style={{ border: '1px solid #000', padding: '12px', background: '#e0e0e0' }}></th>
                  </tr>
                </tfoot>
              </table>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <div style={{ flex: 1, border: '1px solid #1B365D', padding: '12px 15px', borderRadius: '6px', minHeight: '110px', backgroundColor: '#fafafa' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800 }}>Appréciation du conseil</h4>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#222' }}>{bulletin.appreciationGenerale || '— Élève assidu, poursuivez vos efforts.'}</p>
                </div>
                <div style={{ width: '200px', border: '1px solid #1B365D', padding: '12px', borderRadius: '6px', minHeight: '110px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800, textAlign: 'center' }}>Le professeur principal</h4>
                  <div style={{ flex: 1 }}></div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#888', textAlign: 'center' }}>(Visa)</p>
                </div>
                <div style={{ width: '220px', border: '1px solid #1B365D', padding: '12px', borderRadius: '6px', minHeight: '110px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800, textAlign: 'center' }}>Le chef d&apos;établissement</h4>
                  <div style={{ flex: 1 }}></div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#888', textAlign: 'center' }}>(Signature &amp; cachet)</p>
                </div>
              </div>

              {bulletin.estVerrouille && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '80px', color: 'rgba(211,47,47,0.1)', fontWeight: 'bold', pointerEvents: 'none', border: '10px solid rgba(211,47,47,0.1)', padding: '20px' }}>
                  VERROUILLÉ
                </div>
              )}
            </div>
          </div>

          {/* Barre d'actions */}
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
            <Card className="p-5">
              <h3 className="mb-2 font-display text-base font-bold">Statut</h3>
              <Badge variant={bulletin.estVerrouille ? 'destructive' : 'success'}>
                {bulletin.estVerrouille ? 'Verrouillé' : 'Modifiable'}
              </Badge>
              <p className="mt-3 text-sm text-muted-foreground">
                {bulletin.estVerrouille
                  ? 'Validé en conseil de classe. Plus modifiable.'
                  : "Calcul basé sur les notes actuelles. Regénérez après toute nouvelle note."}
              </p>
            </Card>

            <Button loading={pdfLoading} onClick={handleExportPDF}>
              <Download /> Télécharger en PDF
            </Button>

            {canLock && !bulletin.estVerrouille && (
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={handleLock}
              >
                <Lock /> Verrouiller définitivement
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
