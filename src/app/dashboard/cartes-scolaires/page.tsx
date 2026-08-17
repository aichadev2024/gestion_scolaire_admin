'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { eleveService } from '@/services/eleve.service';
import { classeService } from '@/services/classe.service';
import { authService } from '@/services/auth.service';
import { Eleve, Classe } from '@/types';
import CarteEleveCard from '@/components/CarteEleveCard';

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
        const [cls, eleves] = await Promise.all([
          classeService.getClasses(),
          eleveService.getEleves()
        ]);
        setClasses(cls);
        setAllEleves(eleves);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClasseId) {
      setFilteredEleves([]);
      setSelectedEleveId('');
    } else {
      const list = allEleves.filter(e => String(e.classeId) === selectedClasseId && e.statut === 'ACTIF');
      setFilteredEleves(list);
      setSelectedEleveId('');
    }
  }, [selectedClasseId, allEleves]);

  const elevesToShow: Eleve[] = mode === 'LOT'
    ? filteredEleves
    : allEleves.filter(e => String(e.id) === selectedEleveId);

  const handleExportPDF = async () => {
    if (elevesToShow.length === 0) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // CR80: 85.6mm × 54mm
      const CARD_W_MM = 85.6;
      const CARD_H_MM = 54;
      const MARGIN_MM = 5;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PAGE_W = 210;

      const cardsPerRow = Math.floor((PAGE_W - MARGIN_MM) / (CARD_W_MM + MARGIN_MM));
      let col = 0, row = 0;

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

        const imgData = canvas.toDataURL('image/png');
        const x = MARGIN_MM + col * (CARD_W_MM + MARGIN_MM);
        const y = MARGIN_MM + row * (CARD_H_MM + MARGIN_MM);

        // New page if needed
        if (col === 0 && row === 0 && i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', x, y, CARD_W_MM, CARD_H_MM);

        col++;
        if (col >= cardsPerRow) {
          col = 0;
          row++;
          // A4 fits ~4 rows of cards (with margins)
          if (row >= 4 && i < elevesToShow.length - 1) {
            pdf.addPage();
            row = 0; col = 0;
          }
        }
      }

      const filename = mode === 'LOT'
        ? `cartes_classe_${classes.find(c => String(c.id) === selectedClasseId)?.nom || 'export'}_${anneeScolaire.replace('/', '-')}.pdf`
        : `carte_${elevesToShow[0]?.matricule || 'eleve'}.pdf`;

      pdf.save(filename);
    } catch (e) {
      console.error('Erreur export PDF', e);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cartes Scolaires</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Générez et exportez les cartes scolaires numériques au format CR80 (crédit).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {elevesToShow.length > 0 && (
            <>
              <button onClick={handlePrint} style={{ padding: '0.75rem 1.25rem', border: '1px solid rgba(27,54,93,0.3)', color: 'var(--primary-color)', background: 'rgba(27,54,93,0.06)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                🖨️ Imprimer
              </button>
              <button onClick={handleExportPDF} className="btn-primary" style={{ width: 'auto' }} disabled={pdfLoading}>
                {pdfLoading ? '⏳ Génération PDF...' : `📄 Exporter PDF (${elevesToShow.length} carte${elevesToShow.length > 1 ? 's' : ''})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(163,174,209,0.2)', paddingBottom: '0' }}>
        {(['LOT', 'INDIVIDUEL'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            color: mode === m ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: mode === m ? '2px solid var(--primary-color)' : '2px solid transparent', transition: 'all 0.2s'
          }}>
            {m === 'LOT' ? '🏫 Par classe (lot)' : '👤 Élève individuel'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ padding: '0.6rem 1rem', background: 'rgba(27,54,93,0.06)', borderRadius: '10px', border: '1px solid rgba(27,54,93,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏛️</span>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Établissement Détecté</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 800 }}>{nomEcole || authService.getCurrentUser()?.etablissementNom || 'Lycée Massa Makan Diabaté (Bamako)'}</div>
          </div>
        </div>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '220px' }}>
          <label className="input-label">🏫 Classe</label>
          <select className="input-field" value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}>
            <option value="">— Sélectionnez une classe —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>)}
          </select>
        </div>
        {mode === 'INDIVIDUEL' && (
          <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '220px' }}>
            <label className="input-label">🎓 Élève</label>
            <select className="input-field" value={selectedEleveId} onChange={e => setSelectedEleveId(e.target.value)} disabled={!selectedClasseId}>
              <option value="">— Sélectionnez un élève —</option>
              {filteredEleves.map(e => <option key={e.id} value={e.id}>{e.profil.nom} {e.profil.prenom} ({e.matricule})</option>)}
            </select>
          </div>
        )}
        {selectedClasseId && mode === 'LOT' && (
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(5,205,153,0.1)', border: '1px solid rgba(5,205,153,0.3)', borderRadius: '8px', color: '#05cd99', fontWeight: 700, fontSize: '0.85rem' }}>
            ✅ {filteredEleves.length} élève(s) actif(s) trouvé(s)
          </div>
        )}
      </div>

      {/* Cards preview */}
      {loading ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          Chargement des données...
        </div>
      ) : elevesToShow.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🪪</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {!selectedClasseId
              ? 'Sélectionnez une classe pour générer les cartes.'
              : mode === 'INDIVIDUEL' && !selectedEleveId
                ? 'Sélectionnez un élève.'
                : 'Aucun élève actif dans cette classe.'}
          </p>
          {selectedClasseId && filteredEleves.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: '#ee5d50' }}>⚠️ Aucun élève actif affecté à cette classe.</p>
          )}
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem 1.25rem', background: 'rgba(27,54,93,0.06)', borderRadius: '10px', border: '1px solid rgba(27,54,93,0.15)' }}>
            <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
              🪪 {elevesToShow.length} carte{elevesToShow.length > 1 ? 's' : ''} générée{elevesToShow.length > 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>· Année scolaire : {anneeScolaire}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>· Format : CR80 (85.6 × 54 mm)</span>
          </div>

          {/* Cards grid */}
          <div id="cartes-print-zone" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {elevesToShow.map(eleve => (
              <div key={eleve.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <CarteEleveCard
                  ref={el => { if (el) carteRefs.current.set(eleve.matricule, el); }}
                  eleve={eleve}
                  etablissementNom={nomEcole || authService.getCurrentUser()?.etablissementNom || 'ÉTABLISSEMENT SCOLAIRE'}
                  anneeScolaire={anneeScolaire}
                  version={1}
                />
                {eleve.profil?.photoUrl === null || eleve.profil?.photoUrl === undefined ? (
                  <div style={{ width: '323px', padding: '0.4rem 0.75rem', background: 'rgba(255,206,32,0.1)', border: '1px solid rgba(255,206,32,0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                    ⚠️ Photo manquante — visuel générique utilisé
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print, header, nav, button, input, select { display: none !important; }
          #cartes-print-zone {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10mm !important;
            padding: 10mm !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
