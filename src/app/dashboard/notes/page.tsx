'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList, Plus } from 'lucide-react';
import { classeService } from '@/services/classe.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { eleveService } from '@/services/eleve.service';
import { noteService } from '@/services/note.service';
import { Classe, Eleve, Note } from '@/types';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ABREVIATIONS_TYPE_EVALUATION: Record<string, string> = {
  DEVOIR: 'DEV',
  GRAND_DEVOIR: 'G.DEV',
  EXAMEN: 'EXA',
  PARTICIPATION: 'PAR',
};

function abregerTypeEvaluation(type?: string): string {
  if (!type) return '';
  return ABREVIATIONS_TYPE_EVALUATION[type] || type.slice(0, 3);
}

type CategorieClasse = 'LYCEE' | 'COLLEGE' | 'PRIMAIRE' | 'PRIMAIRE_6' | 'MATERNELLE' | 'ALL';

/**
 * Le niveau (Crèche/Maternelle/Primaire/Collège/Lycée) est vérifié en premier et seul —
 * jamais mélangé au nom de la classe dans une même regex : une classe de Primaire nommée
 * « 6ème Année » matchait autrefois le « 6è » du Collège et perdait ses compositions.
 * PRIMAIRE_6 = 6ème année/CM2, seule année du primaire qui fonctionne aussi par trimestre.
 */
function categoriePourClasse(c?: Classe): CategorieClasse {
  if (!c) return 'ALL';
  const niveau = (c.niveauNom || '').toLowerCase();
  const nom = (c.nom || '').toLowerCase();
  if (/lyc[ée]e/.test(niveau)) return 'LYCEE';
  if (/coll[èe]ge/.test(niveau)) return 'COLLEGE';
  if (/maternelle/.test(niveau)) return 'MATERNELLE';
  if (/primaire/.test(niveau)) {
    return /6\s*[eè]me|cm\s*2/.test(nom) ? 'PRIMAIRE_6' : 'PRIMAIRE';
  }
  // Niveau non reconnu (libellé personnalisé) : on retombe sur le nom de la classe.
  if (/lyc[ée]e|term|2nde|1[eè]re/.test(nom)) return 'LYCEE';
  if (/coll[èe]ge|6è|7è|8è|9è/.test(nom)) return 'COLLEGE';
  if (/primaire|cp|ce1|ce2|cm1|cm2/.test(nom)) return 'PRIMAIRE';
  return 'ALL';
}

export default function NotesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matieres, setMatieres] = useState<ClasseMatiereItem[]>([]);
  const [existingNotes, setExistingNotes] = useState<Note[]>([]);

  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [selectedMatiereId, setSelectedMatiereId] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('TRIMESTRE_1');

  const [valeur, setValeur] = useState<number | ''>('');
  const [noteMax, setNoteMax] = useState(20);
  const [typeEvaluation, setTypeEvaluation] = useState('DEVOIR');
  const [appreciation, setAppreciation] = useState('');
  const [targetEleveId, setTargetEleveId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
  }, []);

  const loadNotes = useCallback(() => {
    if (!selectedMatiereId) {
      setExistingNotes([]);
      return;
    }
    noteService
      .getNotesClasseMatiere(Number(selectedMatiereId))
      .then((res) => setExistingNotes(res.filter((n) => n.periode === selectedPeriode)))
      .catch(() => toast.error('Impossible de charger les notes.'));
  }, [selectedMatiereId, selectedPeriode]);

  useEffect(() => {
    if (!selectedClasseId) {
      setMatieres([]);
      setEleves([]);
      return;
    }
    classeMatiereService.getByClasse(Number(selectedClasseId)).then(setMatieres).catch(() => {});
    eleveService
      .getEleves()
      .then((res) =>
        setEleves(
          res.filter(
            (e) =>
              String(e.classeId) === selectedClasseId &&
              (!e.statut || e.statut.toUpperCase() === 'ACTIF'),
          ),
        ),
      )
      .catch(() => {});

    const cat = categoriePourClasse(classes.find((c) => String(c.id) === selectedClasseId));
    setSelectedPeriode(cat === 'LYCEE' ? 'TRIMESTRE_1' : 'COMPOSITION_1');
  }, [selectedClasseId, classes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const currentCategory = categoriePourClasse(classes.find((c) => String(c.id) === selectedClasseId));

  const handleSaveNote = async (eleveId: number) => {
    if (valeur === '' || valeur < 0 || valeur > noteMax) {
      toast.error(`La note doit être comprise entre 0 et ${noteMax}.`);
      return;
    }
    setSaving(true);
    try {
      await noteService.ajouterNote({
        eleveId,
        classeMatiereId: Number(selectedMatiereId),
        periode: selectedPeriode,
        typeEvaluation,
        valeur: Number(valeur),
        noteMax: Number(noteMax),
        appreciation,
      });
      toast.success('Note enregistrée.');
      setTargetEleveId(null);
      setValeur('');
      setAppreciation('');
      loadNotes();
    } catch (e) {
      toast.error(errorMessage(e, "Erreur lors de l'enregistrement de la note"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Saisie des notes"
        description="Ajoutez et consultez les notes par classe, matière et période."
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <Field label="Classe">
          <Select
            value={selectedClasseId}
            onChange={(e) => {
              setSelectedClasseId(e.target.value);
              setSelectedMatiereId('');
            }}
          >
            <option value="">— Sélectionner —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </Select>
        </Field>
        <Field label="Matière">
          <Select value={selectedMatiereId} onChange={(e) => setSelectedMatiereId(e.target.value)} disabled={!selectedClasseId}>
            <option value="">— Sélectionner —</option>
            {matieres.map((m) => (
              <option key={m.id} value={m.id}>{m.matiere.nom} (coef {m.coefficient})</option>
            ))}
          </Select>
        </Field>
        <Field label="Période">
          <Select value={selectedPeriode} onChange={(e) => setSelectedPeriode(e.target.value)}>
            {['PRIMAIRE', 'PRIMAIRE_6', 'MATERNELLE', 'COLLEGE', 'ALL'].includes(currentCategory) && (
              <optgroup label="Compositions">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={`COMPOSITION_${n}`}>Composition n°{n}</option>
                ))}
              </optgroup>
            )}
            {['LYCEE', 'COLLEGE', 'PRIMAIRE_6', 'ALL'].includes(currentCategory) && (
              <optgroup label="Trimestres">
                <option value="TRIMESTRE_1">1er trimestre</option>
                <option value="TRIMESTRE_2">2e trimestre</option>
                <option value="TRIMESTRE_3">3e trimestre</option>
              </optgroup>
            )}
          </Select>
        </Field>
      </div>

      {!selectedClasseId || !selectedMatiereId ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Choisissez une classe et une matière"
          description="La liste des élèves et leurs notes apparaîtra ici."
        />
      ) : eleves.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="Aucun élève actif dans cette classe" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Élève</TableHead>
              <TableHead>Notes ({selectedPeriode.replace('_', ' ').toLowerCase()})</TableHead>
              <TableHead className="w-[320px]">Nouvelle note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eleves.map((eleve) => {
              const notesEleve = existingNotes.filter((n) => n.eleveId === eleve.id);
              const isTarget = targetEleveId === eleve.id;
              return (
                <TableRow key={eleve.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-primary">{eleve.matricule}</span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {eleve.profil?.nom?.toUpperCase()} {eleve.profil?.prenom}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {notesEleve.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Aucune note</span>
                      ) : (
                        notesEleve.map((n, i) => (
                          <Badge key={i} variant="secondary">
                            {n.valeur}/{n.noteMax}
                            <span className="ml-1 opacity-70">{abregerTypeEvaluation(n.typeEvaluation)}</span>
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {!isTarget ? (
                      <Button size="sm" variant="outline" onClick={() => setTargetEleveId(eleve.id)}>
                        <Plus /> Ajouter
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="h-9 w-20"
                            placeholder="Note"
                            value={valeur}
                            onChange={(e) => setValeur(e.target.value ? Number(e.target.value) : '')}
                          />
                          <span className="text-muted-foreground">/</span>
                          <Input
                            type="number"
                            className="h-9 w-20"
                            value={noteMax}
                            onChange={(e) => setNoteMax(Number(e.target.value))}
                          />
                        </div>
                        <Select
                          className="h-9"
                          value={typeEvaluation}
                          onChange={(e) => setTypeEvaluation(e.target.value)}
                        >
                          <option value="DEVOIR">Devoir</option>
                          <option value="GRAND_DEVOIR">Grand devoir</option>
                          <option value="EXAMEN">Examen</option>
                          <option value="PARTICIPATION">Participation</option>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" loading={saving} onClick={() => handleSaveNote(eleve.id)}>
                            Enregistrer
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setTargetEleveId(null)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
