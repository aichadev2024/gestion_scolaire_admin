'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileBarChart, Printer, Save, Settings2 } from 'lucide-react';
import { classeService } from '@/services/classe.service';
import { authService } from '@/services/auth.service';
import { rapportTrimestrielService, RapportTrimestriel } from '@/services/rapportTrimestriel.service';
import { Classe } from '@/types';
import { anneeScolaireCourante, anneesScolairesRecentes } from '@/lib/anneeScolaire';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/form-field';

const PERIODES: { value: string; label: string }[] = [
  { value: 'TRIMESTRE_1', label: '1er trimestre' },
  { value: 'TRIMESTRE_2', label: '2e trimestre' },
  { value: 'TRIMESTRE_3', label: '3e trimestre' },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: `COMPOSITION_${n}`, label: `Composition n°${n}` })),
];
const libellePeriode = (p: string) => PERIODES.find((x) => x.value === p)?.label ?? p;

const STATUT_DISCIPLINE: Record<string, string> = {
  RETARD: 'Retards',
  ABSENT: 'Absences',
  TENUE_NON_PORTEE: 'Tenue non portée',
  REFUS_EXERCICE: "Refus de l'exercice",
};

const NAVY = '#1B365D';
const BLUE = '#2E7CB8';
const nombre = (n: number | null | undefined, suffixe = '') => (n == null ? '—' : `${n.toLocaleString('fr-FR')}${suffixe}`);
const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
const montant = (n: number, devise: string) => `${Math.round(n).toLocaleString('fr-FR')} ${devise}`;

export default function RapportsTrimestrielsPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState('');
  const [periode, setPeriode] = useState('TRIMESTRE_1');
  const [annee, setAnnee] = useState(anneeScolaireCourante());
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [rapport, setRapport] = useState<RapportTrimestriel | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoEchec, setLogoEchec] = useState(false);

  const peutEnregistrer = authService.getCurrentUser()?.role === 'DIRECTEUR';

  useEffect(() => {
    classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
  }, []);

  const generer = async (avecDates: boolean) => {
    setLoading(true);
    try {
      const r = await rapportTrimestrielService.generer({
        classeId: classeId ? Number(classeId) : undefined,
        periode,
        anneeScolaire: annee,
        dateDebut: avecDates && dateDebut ? dateDebut : undefined,
        dateFin: avecDates && dateFin ? dateFin : undefined,
      });
      setRapport(r);
      setDateDebut(r.dateDebut);
      setDateFin(r.dateFin);
      setCommentaire(r.commentaire ?? '');
      setLogoEchec(false);
    } catch (e) {
      toast.error(errorMessage(e, 'Impossible de générer le rapport.'));
    } finally {
      setLoading(false);
    }
  };

  const enregistrer = async () => {
    if (!rapport) return;
    setSaving(true);
    try {
      await rapportTrimestrielService.enregistrer({
        classeId: rapport.classeId ?? undefined,
        periode: rapport.periode,
        anneeScolaire: rapport.anneeScolaire,
        dateDebut,
        dateFin,
        commentaire,
      });
      setRapport({ ...rapport, commentaire: commentaire.trim() || null });
      toast.success('Bilan enregistré.');
    } catch (e) {
      toast.error(errorMessage(e, "Impossible d'enregistrer le bilan."));
    } finally {
      setSaving(false);
    }
  };

  // Uniquement le logo de l'école : sans logo (ou s'il ne charge pas), on n'affiche rien.
  const logo = rapport?.entete.logoUrl && !logoEchec ? rapport.entete.logoUrl : null;
  const parClasse = rapport && rapport.classeId == null;

  return (
    <div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #rapport-imprimable,
          #rapport-imprimable * {
            visibility: visible;
          }
          #rapport-imprimable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
          }
          .rapport-bloc {
            break-inside: avoid;
          }
        }
      `}</style>
      <PageHeader
        title="Rapports trimestriels"
        description="Bilan chiffré d'une classe ou de tout l'établissement pour une période, avec le commentaire de la direction."
      />

      <Card className="mb-6 flex flex-wrap items-end gap-4 p-4">
        <Field label="Année scolaire" className="min-w-36 flex-1">
          <Select value={annee} onChange={(e) => setAnnee(e.target.value)}>
            {anneesScolairesRecentes().map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </Field>
        <Field label="Période" className="min-w-40 flex-1">
          <Select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            {PERIODES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Classe" className="min-w-44 flex-1">
          <Select value={classeId} onChange={(e) => setClasseId(e.target.value)}>
            <option value="">Tout l&apos;établissement</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </Select>
        </Field>
        <Button loading={loading} onClick={() => generer(false)}>
          <Settings2 /> Générer le rapport
        </Button>
      </Card>

      {!rapport ? (
        <EmptyState
          icon={<FileBarChart />}
          title="Aucun rapport affiché"
          description="Choisissez l'année, la période et la classe (ou tout l'établissement), puis générez le rapport."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <Card className="grid gap-4 p-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="text-sm font-semibold">Période prise en compte pour les présences et la discipline</div>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Du">
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                </Field>
                <Field label="Au">
                  <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                </Field>
                <Button variant="outline" loading={loading} onClick={() => generer(true)}>
                  Recalculer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Les notes sont celles de la période choisie ; les dates ne servent qu&apos;aux présences et à la discipline.
              </p>
            </div>
            <div className="space-y-3">
              <Field
                label="Bilan de la direction"
                hint={peutEnregistrer ? 'Apparaît dans le rapport imprimé.' : 'Seul le directeur peut enregistrer le bilan.'}
              >
                <Textarea
                  rows={5}
                  maxLength={6000}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ex : Le premier trimestre s'est déroulé dans des conditions satisfaisantes…"
                  readOnly={!peutEnregistrer}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {peutEnregistrer && (
                  <Button variant="outline" loading={saving} onClick={enregistrer}>
                    <Save /> Enregistrer le bilan
                  </Button>
                )}
                <Button onClick={() => window.print()}>
                  <Printer /> Imprimer / Enregistrer en PDF
                </Button>
              </div>
            </div>
          </Card>

          {/* Document imprimable — fond blanc quelle que soit l'apparence de l'application */}
          <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
            <div
              id="rapport-imprimable"
              style={{ padding: '40px', minWidth: '780px', fontFamily: 'serif', color: '#000', backgroundColor: '#ffffff', fontSize: '13px' }}
            >
              {/* En-tête officiel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '15px', fontSize: '11px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RÉPUBLIQUE DU MALI</div>
                  <div style={{ fontStyle: 'italic', color: '#555' }}>Un Peuple - Un But - Une Foi</div>
                  <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>MINISTÈRE DE L&apos;ÉDUCATION NATIONALE DU MALI</div>
                  {rapport.entete.rive && (
                    <div style={{ fontSize: '10px', color: '#444', fontWeight: 600, textTransform: 'uppercase' }}>BAMAKO {rapport.entete.rive}</div>
                  )}
                  {rapport.entete.cap && (
                    <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase' }}>{rapport.entete.cap}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: NAVY }}>RAPPORT DE PÉRIODE</div>
                  <div style={{ fontSize: '11px', color: '#333', fontWeight: 600 }}>ANNÉE SCOLAIRE {rapport.anneeScolaire}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px double ${NAVY}`, paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="Logo de l'établissement" onError={() => setLogoEchec(true)} style={{ height: '70px', width: '70px', objectFit: 'contain' }} />
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 900, color: NAVY, textTransform: 'uppercase' }}>{rapport.entete.nom}</h2>
                    {rapport.entete.adresse && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#444' }}>{rapport.entete.adresse}</p>}
                    {rapport.entete.telephone && <p style={{ margin: 0, fontSize: '12px', color: '#444' }}>Tél. : {rapport.entete.telephone}</p>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(27,54,93,0.04)', padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(27,54,93,0.15)' }}>
                  <h1 style={{ margin: 0, fontSize: '19px', textTransform: 'uppercase', color: NAVY, fontWeight: 800 }}>{libellePeriode(rapport.periode)}</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: BLUE }}>{rapport.portee}</p>
                </div>
              </div>

              {/* Chiffres clés */}
              <div className="rapport-bloc" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '22px' }}>
                {[
                  ['Élèves inscrits', nombre(rapport.effectifs.total), `${rapport.effectifs.garcons} garçons · ${rapport.effectifs.filles} filles`],
                  ['Moyenne générale', nombre(rapport.resultats.moyenne, ' / 20'), `${rapport.resultats.evalues} élève(s) évalué(s)`],
                  ['Taux de réussite', nombre(rapport.resultats.tauxReussite, ' %'), 'moyenne ≥ 10'],
                  ['Taux de présence', nombre(rapport.presences.tauxPresence, ' %'), `${rapport.presences.absencesNonJustifiees} absence(s) non justifiée(s)`],
                ].map(([titre, valeur, detail]) => (
                  <div key={titre} style={{ border: `1px solid ${NAVY}33`, borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#555', letterSpacing: '0.4px' }}>{titre}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: NAVY }}>{valeur}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>{detail}</div>
                  </div>
                ))}
              </div>

              {/* Résultats */}
              <Section titre="Résultats scolaires">
                {rapport.resultats.evalues === 0 ? (
                  <p style={{ margin: 0, color: '#666' }}>Aucune note saisie sur cette période.</p>
                ) : (
                  <>
                    <p style={{ margin: '0 0 8px' }}>
                      Moyenne la plus haute : <strong>{nombre(rapport.resultats.moyenneMax)}</strong> · la plus basse :{' '}
                      <strong>{nombre(rapport.resultats.moyenneMin)}</strong>
                      {rapport.resultats.nonEvalues > 0 && <> · {rapport.resultats.nonEvalues} élève(s) sans aucune note</>}.
                    </p>
                    <Tableau
                      entetes={['Mention', 'Élèves', 'Part']}
                      lignes={Object.entries(rapport.resultats.mentions).map(([m, n]) => [
                        m, String(n), `${Math.round((100 * n) / rapport.resultats.evalues)} %`,
                      ])}
                    />
                  </>
                )}
              </Section>

              {parClasse ? (
                <Section titre="Détail par classe">
                  <Tableau
                    entetes={['Classe', 'Effectif', 'Évalués', 'Moyenne', 'Réussite', 'Présence', ...(rapport.finances ? ['Recouvrement'] : [])]}
                    lignes={rapport.classes.map((c) => [
                      c.classe, String(c.effectif), String(c.evalues), nombre(c.moyenne), nombre(c.tauxReussite, ' %'), nombre(c.tauxPresence, ' %'),
                      ...(rapport.finances ? [nombre(c.tauxRecouvrement, ' %')] : []),
                    ])}
                  />
                </Section>
              ) : (
                <Section titre="Résultats par matière">
                  <Tableau
                    entetes={['Matière', 'Enseignant', 'Coef.', 'Moyenne de la classe', 'Réussite']}
                    lignes={rapport.matieres.map((m) => [
                      m.matiere, m.enseignant ?? '—', String(m.coefficient), nombre(m.moyenne), nombre(m.tauxReussite, ' %'),
                    ])}
                    vide="Aucune matière n'est rattachée à cette classe."
                  />
                </Section>
              )}

              {rapport.meilleurs.length > 0 && (
                <Section titre="Meilleurs résultats">
                  <Tableau
                    entetes={['Rang', 'Élève', 'Classe', 'Moyenne']}
                    lignes={rapport.meilleurs.map((e, i) => [String(i + 1), e.nom, e.classe, e.moyenne.toFixed(2)])}
                  />
                </Section>
              )}

              {rapport.enDifficulte.length > 0 && (
                <Section titre="Élèves en difficulté (moyenne inférieure à 8)">
                  <Tableau
                    entetes={['Élève', 'Classe', 'Moyenne']}
                    lignes={rapport.enDifficulte.map((e) => [e.nom, e.classe, e.moyenne.toFixed(2)])}
                  />
                </Section>
              )}

              <Section titre={`Assiduité et discipline (du ${dateFr(rapport.dateDebut)} au ${dateFr(rapport.dateFin)})`}>
                <Tableau
                  entetes={['Présents', 'Retards', 'Absences justifiées', 'Absences non justifiées', 'Taux de présence']}
                  lignes={[[
                    String(rapport.presences.presents), String(rapport.presences.retards),
                    String(rapport.presences.absencesJustifiees), String(rapport.presences.absencesNonJustifiees),
                    nombre(rapport.presences.tauxPresence, ' %'),
                  ]]}
                />
                <p style={{ margin: '8px 0 0' }}>
                  {rapport.discipline.total === 0 ? (
                    'Aucune fiche de discipline sur la période.'
                  ) : (
                    <>
                      <strong>{rapport.discipline.total}</strong> fiche(s) de discipline :{' '}
                      {Object.entries(rapport.discipline.parStatut)
                        .map(([s, n]) => `${STATUT_DISCIPLINE[s] ?? s} : ${n}`)
                        .join(' · ')}
                      {rapport.discipline.nonTraites > 0 && <> — dont {rapport.discipline.nonTraites} non traitée(s)</>}.
                    </>
                  )}
                </p>
              </Section>

              {rapport.finances && (
                <Section titre="Situation financière (à ce jour)">
                  <Tableau
                    entetes={['Frais attendus', 'Encaissé', 'Reste à recouvrer', 'Recouvrement']}
                    lignes={[[
                      montant(rapport.finances.attendu, rapport.finances.devise),
                      montant(rapport.finances.encaisse, rapport.finances.devise),
                      montant(rapport.finances.reste, rapport.finances.devise),
                      nombre(rapport.finances.tauxRecouvrement, ' %'),
                    ]]}
                  />
                  <p style={{ margin: '8px 0 0' }}>
                    Encaissé du {dateFr(rapport.dateDebut)} au {dateFr(rapport.dateFin)} :{' '}
                    <strong>{montant(rapport.finances.encaisseSurPeriode, rapport.finances.devise)}</strong>.{' '}
                    {rapport.finances.elevesEnRetard > 0 ? (
                      <>
                        <strong>{rapport.finances.elevesEnRetard}</strong> élève(s) en retard de paiement pour{' '}
                        <strong>{montant(rapport.finances.montantEnRetard, rapport.finances.devise)}</strong> échus
                      </>
                    ) : (
                      'Aucun retard de paiement'
                    )}
                    {rapport.finances.arrieres > 0 && <> (dont arriérés des années précédentes : {montant(rapport.finances.arrieres, rapport.finances.devise)} dus au total)</>}.
                  </p>
                </Section>
              )}

              <Section titre="Bilan et observations de la direction">
                {commentaire.trim() ? (
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{commentaire.trim()}</p>
                ) : (
                  <div style={{ height: '70px', borderBottom: '1px dotted #999' }} />
                )}
              </Section>

              <div className="rapport-bloc" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '12px' }}>
                <div style={{ color: '#666' }}>
                  Rapport généré le {new Date(rapport.genereLe).toLocaleDateString('fr-FR')} — {rapport.entete.nom}
                </div>
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ fontWeight: 700 }}>Le Directeur</div>
                  <div style={{ height: '60px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rapport-bloc" style={{ marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${NAVY}33`, paddingBottom: '4px' }}>
        {titre}
      </h3>
      {children}
    </div>
  );
}

function Tableau({ entetes, lignes, vide }: { entetes: string[]; lignes: string[][]; vide?: string }) {
  if (lignes.length === 0) return <p style={{ margin: 0, color: '#666' }}>{vide ?? 'Aucune donnée.'}</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead>
        <tr>
          {entetes.map((h, i) => (
            <th key={h} style={{ textAlign: i === 0 ? 'left' : 'center', background: NAVY, color: '#fff', padding: '6px 8px', fontWeight: 700, border: `1px solid ${NAVY}` }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lignes.map((l, r) => (
          <tr key={r} style={{ background: r % 2 ? '#f5f7fa' : '#fff' }}>
            {l.map((c, i) => (
              <td key={i} style={{ textAlign: i === 0 ? 'left' : 'center', padding: '5px 8px', border: '1px solid #d5dae1' }}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
