'use client';

import { useEffect, useState } from 'react';
import { matiereService } from '@/services/matiere.service';
import { Matiere } from '@/types';

export default function MatieresPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    code: ''
  });

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const data = await matiereService.getMatieres();
      setMatieres(data);
    } catch (err) {
      console.error("Erreur", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await matiereService.createMatiere(formData);
      setFormData({ nom: '', code: '' });
      setShowForm(false);
      await fetchMatieres();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestion des Matières</h1>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvelle Matière'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Ajouter une matière</h2>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nom de la matière</label>
              <input type="text" name="nom" className="input-field" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Mathématiques" required />
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Code</label>
              <input type="text" name="code" className="input-field" value={formData.code} onChange={handleInputChange} placeholder="Ex: MATH-01" required />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Chargement...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom de la Matière</th>
              </tr>
            </thead>
            <tbody>
              {matieres.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '2rem' }}>Aucune matière</td>
                </tr>
              ) : (
                matieres.map((m) => (
                  <tr key={m.id}>
                    <td><span className="badge badge-primary">{m.code}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.nom}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
