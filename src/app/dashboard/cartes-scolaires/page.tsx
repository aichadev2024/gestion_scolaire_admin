'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Building2, GraduationCap, IdCard, Loader2, Printer, School, TriangleAlert } from 'lucide-react';
import { eleveService } from '@/services/eleve.service';
import { classeService } from '@/services/classe.service';
import { authService } from '@/services/auth.service';
import { Eleve, Classe } from '@/types';
import { cn } from '@/lib/utils';
import CarteEleveCard from '@/components/CarteEleveCard';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/form-field';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartesScolairesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [allEleves, setAllEleves] = useState<Eleve[]>([]);
  const [filteredEleves, setFilteredEleves] = useState<Eleve[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string>('');
  const [selectedEleveId, setSelectedEleveId] = useState<string>('');
  const [nomEcole, setNomEcole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mode, setMode] = useState<'LOT' | 'INDIVIDUEL'>('LOT');
  const carteRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const anneeScolaire = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user?.etablissementNom) {
      setNomEcole(user.etablissementNom);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [cls, eleves] = await Promise.all([classeService.getClasses(), eleveService.getEleves()]);
        setClasses(cls);
        setAllEleves(eleves);
      } catch {
        toast.error('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClasseId) {
      setFilteredEleves([]);
      setSelectedEleveId('');
    } else {
      const list = allEleves.filter((e) => String(e.classeId) === selectedClasseId && e.statut === 'ACTIF');
      setFilteredEleves(list);
      setSelectedEleveId('');
    }
  }, [selectedClasseId, allEleves]);

  const elevesToShow: Eleve[] =
    mode === 'LOT' ? filteredEleves : allEleves.filter((e) => String(e.id) === selectedEleveId);

  const etablissementLabel =
    nomEcole || authService.getCurrentUser()?.etablissementNom || 'ÉTABLISSEMENT SCOLAIRE';

  const handleExportPDF = async () => {
    if (elevesToShow.length === 0) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // CR80: 85.6mm × 54mm
      const CARD_W_MM = 85.6;
      const CARD_H_MM = 54;
      const MARGIN_MM = 8;
      const GAP_MM = 6;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PAGE_W = 210;
      const PAGE_H = 297;

      const cardsPerRow = Math.max(1, Math.floor((PAGE_W - 2 * MARGIN_MM + GAP_MM) / (CARD_W_MM + GAP_MM)));
      const rowsPerPage = Math.max(1, Math.floor((PAGE_H - 2 * MARGIN_MM + GAP_MM) / (CARD_H_MM + GAP_MM)));
      const perPage = cardsPerRow * rowsPerPage;

      let placed = 0; // nombre de cartes réellement posées (sert au découpage en pages)
      for (let i = 0; i < elevesToShow.length; i++) {
        const eleve = elevesToShow[i];
        const el = carteRefs.current.get(eleve.matricule);
        if (!el) continue;

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });

        const slot = placed % perPage;
        if (placed > 0 && slot === 0) {
          pdf.addPage();
        }
        const col = slot % cardsPerRow;
        const row = Math.floor(slot / cardsPerRow);

        // Hauteur dérivée du ratio réel du canvas → aucune déformation même si
        // le rendu diffère légèrement du 323×204 théorique.
        const drawH = Math.min(CARD_H_MM, CARD_W_MM * (canvas.height / canvas.width));
        const x = MARGIN_MM + col * (CARD_W_MM + GAP_MM);
        const y = MARGIN_MM + row * (CARD_H_MM + GAP_MM) + (CARD_H_MM - drawH) / 2;

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, CARD_W_MM, drawH);
        placed++;
      }

      const filename =
        mode === 'LOT'
          ? `cartes_classe_${classes.find((c) => String(c.id) === selectedClasseId)?.nom || 'export'}_${anneeScolaire.replace('/', '-')}.pdf`
          : `carte_${elevesToShow[0]?.matricule || 'eleve'}.pdf`;

      pdf.save(filename);
      toast.success('PDF généré.');
    } catch (e) {
      console.error('Erreur export PDF', e);
      toast.error("Erreur lors de l'export PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div>
      <PageHeader
        title="Cartes scolaires"
        description="Générez et exportez les cartes scolaires numériques au format CR80 (carte de crédit)."
      >
        {elevesToShow.length > 0 && (
          <>
            <Button variant="outline" onClick={handlePrint}>
              <Printer /> Imprimer
            </Button>
            <Button onClick={handleExportPDF} loading={pdfLoading}>
              <IdCard />
              {pdfLoading
                ? 'Génération…'
                : `Exporter PDF (${elevesToShow.length} carte${elevesToShow.length > 1 ? 's' : ''})`}
            </Button>
          </>
        )}
      </PageHeader>

      {/* Sélecteur de mode */}
      <div className="mb-6 flex gap-2">
        {(['LOT', 'INDIVIDUEL'] as const).map((m) => (
          <Button key={m} variant={mode === m ? 'default' : 'outline'} size="sm" onClick={() => setMode(m)}>
            {m === 'LOT' ? <School /> : <GraduationCap />}
            {m === 'LOT' ? 'Par classe (lot)' : 'Élève individuel'}
          </Button>
        ))}
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex min-w-56 items-center gap-3 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2">
          <Building2 className="size-6 shrink-0 text-primary" />
          <div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
              Établissement détecté
            </div>
            <div className="text-sm font-extrabold text-primary">{etablissementLabel}</div>
          </div>
        </div>
        <Field label="Classe" className="min-w-52 flex-1">
          <Select value={selectedClasseId} onChange={(e) => setSelectedClasseId(e.target.value)}>
            <option value="">— Sélectionnez une classe —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} ({c.anneeScolaire})
              </option>
            ))}
          </Select>
        </Field>
        {mode === 'INDIVIDUEL' && (
          <Field label="Élève" className="min-w-52 flex-1">
            <Select
              value={selectedEleveId}
              onChange={(e) => setSelectedEleveId(e.target.value)}
              disabled={!selectedClasseId}
            >
              <option value="">— Sélectionnez un élève —</option>
              {filteredEleves.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.profil.nom} {e.profil.prenom} ({e.matricule})
                </option>
              ))}
            </Select>
          </Field>
        )}
        {selectedClasseId && mode === 'LOT' && (
          <span className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-bold text-success">
            {filteredEleves.length} élève(s) actif(s)
          </span>
        )}
      </div>

      {/* Aperçu des cartes */}
      {loading ? (
        <div className="flex flex-wrap gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[204px] w-[323px] rounded-[10px]" />
          ))}
        </div>
      ) : elevesToShow.length === 0 ? (
        <EmptyState
          icon={<IdCard />}
          title={
            !selectedClasseId
              ? 'Sélectionnez une classe pour générer les cartes.'
              : mode === 'INDIVIDUEL' && !selectedEleveId
                ? 'Sélectionnez un élève.'
                : 'Aucun élève actif dans cette classe.'
          }
          description={
            selectedClasseId && filteredEleves.length === 0
              ? 'Aucun élève actif affecté à cette classe.'
              : undefined
          }
        />
      ) : (
        <>
          {/* Barre de stats */}
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-primary/15 bg-primary/[0.06] px-4 py-3 text-sm">
            <span className="font-bold text-primary">
              {elevesToShow.length} carte{elevesToShow.length > 1 ? 's' : ''} générée
              {elevesToShow.length > 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground">Année scolaire : {anneeScolaire}</span>
            <span className="text-muted-foreground">Format : CR80 (85.6 × 54 mm)</span>
          </div>

          {/* Grille de cartes */}
          <div id="cartes-print-zone" className="flex flex-wrap gap-6">
            {elevesToShow.map((eleve) => (
              <div key={eleve.id} className="flex flex-col gap-2">
                <CarteEleveCard
                  ref={(el) => {
                    if (el) carteRefs.current.set(eleve.matricule, el);
                  }}
                  eleve={eleve}
                  etablissementNom={etablissementLabel}
                  anneeScolaire={anneeScolaire}
                  version={1}
                />
                {eleve.profil?.photoUrl == null && (
                  <div
                    className={cn(
                      'carte-warn flex w-[323px] items-center gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-3 py-1.5',
                      'text-xs font-semibold text-gold-foreground',
                    )}
                  >
                    <TriangleAlert className="size-3.5 shrink-0 text-gold" />
                    Photo manquante — visuel générique utilisé
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* CSS d'impression — on isole la zone des cartes : tout le reste (barre
          latérale, en-têtes, filtres, avertissements) est masqué, et la grille
          reprend la taille physique CR80 exacte pour éviter la déformation. */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          #cartes-print-zone, #cartes-print-zone * { visibility: visible !important; }
          #cartes-print-zone {
            position: absolute !important;
            left: 0; top: 0;
            width: 100%;
            display: flex !important;
            flex-wrap: wrap !important;
            align-content: flex-start !important;
            gap: 6mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #cartes-print-zone > div { break-inside: avoid; page-break-inside: avoid; }
          #cartes-print-zone .carte-warn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
