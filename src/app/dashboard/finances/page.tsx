'use client';

import { useEffect, useState } from 'react';
import { financeService } from '@/services/finance.service';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { Classe, Eleve, FraisScolarite, Paiement } from '@/types';

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<'FRAIS' | 'PAIEMENTS'>('FRAIS');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [paiementsEleve, setPaiementsEleve] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // Frais Form State
  const [fraisForm, setFraisForm] = useState({
    classeId: '',
    titre: '',
    montant: '',
    dateEcheance: ''
  });

  // Paiement Form State
  const [paiementForm, setPaiementForm] = useState({
    eleveId: '',
    fraisId: '',
    montantPaye: '',
    modePaiement: 'ESPECES',
    referenceTransaction: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clsData, elvData] = await Promise.all([
          classeService.getClasses(),
          eleveService.getEleves()
        ]);
        setClasses(clsData);
        setEleves(elvData);
      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch payments when eleve is selected
  useEffect(() => {
    if (!paiementForm.eleveId) {
      setPaiementsEleve([]);
      return;
    }
    financeService.getPaiementsByEleve(parseInt(paiementForm.eleveId))
      .then(setPaiementsEleve)
      .catch(console.error);
  }, [paiementForm.eleveId]);

  const handleFraisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await financeService.createFrais({
        classeId: parseInt(fraisForm.classeId),
        titre: fraisForm.titre,
        montant: parseFloat(fraisForm.montant),
        dateEcheance: fraisForm.dateEcheance
      });
      setSuccess("Frais créé avec succès !");
      setFraisForm({ classeId: '', titre: '', montant: '', dateEcheance: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création du frais");
    }
  };

  const handlePaiementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const nouveauPaiement = await financeService.createPaiement({
        eleveId: parseInt(paiementForm.eleveId),
        fraisId: parseInt(paiementForm.fraisId),
        montantPaye: parseFloat(paiementForm.montantPaye),
        modePaiement: paiementForm.modePaiement,
        referenceTransaction: paiementForm.referenceTransaction || 'CASH'
      });
      setSuccess("Paiement enregistré avec succès !");
      setPaiementForm({ ...paiementForm, montantPaye: '', referenceTransaction: '' });
      // Refresh past payments
      if (paiementForm.eleveId) {
        const updated = await financeService.getPaiementsByEleve(parseInt(paiementForm.eleveId));
        setPaiementsEleve(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement du paiement");
    }
  };

  const handleDownloadRecu = async (numeroRecu: string) => {
    try {
      setDownloadingPdf(numeroRecu);
      const blob = await financeService.telechargerRecuPdf(numeroRecu);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-${numeroRecu}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Impossible de télécharger le reçu PDF.");
    } finally {
      setDownloadingPdf(null);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Finances & Comptabilité</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gestion des frais de scolarité, encaissements et génération de reçus PDF.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn-primary"
          style={{ width: 'auto', backgroundColor: activeTab === 'FRAIS' ? 'var(--primary-color)' : 'rgba(163, 174, 209, 0.2)', color: activeTab === 'FRAIS' ? 'white' : 'var(--text-primary)' }}
          onClick={() => { setActiveTab('FRAIS'); setError(''); setSuccess(''); }}
        >
          Définir des Frais de Scolarité
        </button>
        <button
          className="btn-primary"
          style={{ width: 'auto', backgroundColor: activeTab === 'PAIEMENTS' ? '#05cd99' : 'rgba(163, 174, 209, 0.2)', color: activeTab === 'PAIEMENTS' ? 'white' : 'var(--text-primary)' }}
          onClick={() => { setActiveTab('PAIEMENTS'); setError(''); setSuccess(''); }}
        >
          Encaisser un Paiement & Reçus
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(238, 93, 80, 0.1)', borderRadius: '8px' }}>{error}</div>}
      {success && <div style={{ color: 'var(--success)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(5, 205, 153, 0.1)', borderRadius: '8px' }}>{success}</div>}

      {activeTab === 'FRAIS' && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>➕ Nouveau Frais de Scolarité</h2>
          <form onSubmit={handleFraisSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Classe concernée</label>
              <select className="input-field" value={fraisForm.classeId} onChange={e => setFraisForm({...fraisForm, classeId: e.target.value})} required>
                <option value="">Sélectionnez une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Titre (Ex: Inscription, Tranche 1)</label>
              <input type="text" className="input-field" value={fraisForm.titre} onChange={e => setFraisForm({...fraisForm, titre: e.target.value})} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Montant (FCFA)</label>
              <input type="number" className="input-field" value={fraisForm.montant} onChange={e => setFraisForm({...fraisForm, montant: e.target.value})} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Date d'échéance</label>
              <input type="date" className="input-field" value={fraisForm.dateEcheance} onChange={e => setFraisForm({...fraisForm, dateEcheance: e.target.value})} required />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                Créer le frais
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'PAIEMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>💳 Encaisser un paiement</h2>
            <form onSubmit={handlePaiementSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Élève *</label>
                <select className="input-field" value={paiementForm.eleveId} onChange={e => setPaiementForm({...paiementForm, eleveId: e.target.value})} required>
                  <option value="">— Sélectionnez un élève —</option>
                  {eleves.map(e => <option key={e.id} value={e.id}>{e.matricule} - {e.profil.nom} {e.profil.prenom}</option>)}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">ID du Frais *</label>
                <input type="number" className="input-field" placeholder="Ex: 1" value={paiementForm.fraisId} onChange={e => setPaiementForm({...paiementForm, fraisId: e.target.value})} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Montant Payé (FCFA) *</label>
                <input type="number" className="input-field" value={paiementForm.montantPaye} onChange={e => setPaiementForm({...paiementForm, montantPaye: e.target.value})} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Mode de Paiement</label>
                <select className="input-field" value={paiementForm.modePaiement} onChange={e => setPaiementForm({...paiementForm, modePaiement: e.target.value})}>
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="VIREMENT">Virement</option>
                </select>
              </div>

              {paiementForm.modePaiement !== 'ESPECES' && (
                <div className="input-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label className="input-label">Référence Transaction *</label>
                  <input type="text" className="input-field" value={paiementForm.referenceTransaction} onChange={e => setPaiementForm({...paiementForm, referenceTransaction: e.target.value})} required />
                </div>
              )}

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ width: 'auto', backgroundColor: '#05cd99' }}>
                  ✓ Enregistrer & Générer Reçu
                </button>
              </div>
            </form>
          </div>

          {/* Past Payments for selected student */}
          {paiementForm.eleveId && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                📋 Historique des Paiements & Reçus PDF
              </h3>
              {paiementsEleve.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aucun paiement enregistré pour cet élève.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(163,174,209,0.2)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>N° Reçu / Date</th>
                      <th style={{ padding: '0.75rem' }}>Montant</th>
                      <th style={{ padding: '0.75rem' }}>Mode</th>
                      <th style={{ padding: '0.75rem' }}>Référence</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiementsEleve.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(163,174,209,0.1)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          {p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#05cd99' }}>
                          {p.montantPaye?.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td style={{ padding: '0.75rem' }}>{p.modePaiement}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {p.referenceTransaction || 'CASH'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => handleDownloadRecu(String(p.id))}
                            disabled={downloadingPdf === String(p.id)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(5,205,153,0.1)',
                              color: '#05cd99',
                              border: '1px solid rgba(5,205,153,0.3)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            {downloadingPdf === String(p.id) ? '⏳ PDF...' : '📄 Télécharger Reçu PDF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
