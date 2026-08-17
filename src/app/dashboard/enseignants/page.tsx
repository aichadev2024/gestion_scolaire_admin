'use client';

import { useEffect, useState } from 'react';
import { enseignantService } from '@/services/enseignant.service';
import { Enseignant } from '@/types';

export default function EnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    genre: 'M',
    dateNaissance: '',
    adresse: '',
    biographie: ''
  });

  const fetchEnseignants = async () => {
    try {
      setLoading(true);
      const data = await enseignantService.getEnseignants();
      setEnseignants(data);
    } catch (err) {
      console.error("Erreur lors du chargement des enseignants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnseignants();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        biographie: formData.biographie,
        profil: {
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          email: formData.email,
          genre: formData.genre as 'M' | 'F',
          dateNaissance: formData.dateNaissance,
          adresse: formData.adresse
        }
      };

      await enseignantService.createEnseignant(payload);
      
      // Reset form and refresh list
      setFormData({ prenom: '', nom: '', telephone: '', email: '', genre: 'M', dateNaissance: '', adresse: '', biographie: '' });
      setShowForm(false);
      await fetchEnseignants();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création de l'enseignant");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestion des Enseignants</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Consultez et ajoutez de nouveaux professeurs.</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ width: 'auto', backgroundColor: '#05cd99' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Annuler' : '+ Nouvel Enseignant'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Ajouter un enseignant</h2>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Prénom *</label>
              <input type="text" name="prenom" className="input-field" value={formData.prenom} onChange={handleInputChange} placeholder="Ex: Oumar" required />
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nom *</label>
              <input type="text" name="nom" className="input-field" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Traoré" required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Genre</label>
              <select name="genre" className="input-field" value={formData.genre} onChange={handleInputChange}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Date de Naissance *</label>
              <input type="date" name="dateNaissance" className="input-field" value={formData.dateNaissance} onChange={handleInputChange} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Téléphone</label>
              <input type="text" name="telephone" className="input-field" value={formData.telephone} onChange={handleInputChange} placeholder="Ex: +223 76 00 00 00" />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Adresse Email (pour envoi des accès) *</label>
              <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} placeholder="Ex: oumar.traore@gmail.com" required />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Adresse</label>
              <input type="text" name="adresse" className="input-field" value={formData.adresse} onChange={handleInputChange} placeholder="Ex: Hamdallaye ACI 2000, Bamako" />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Biographie / Spécialité</label>
              <textarea 
                name="biographie" 
                className="input-field" 
                rows={3} 
                value={formData.biographie} 
                onChange={handleInputChange} 
                placeholder="Ex: Professeur de Mathématiques avec 10 ans d'expérience..."
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ width: 'auto', backgroundColor: '#05cd99' }} disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer le professeur'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement des enseignants...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom & Prénom</th>
                <th>Téléphone</th>
                <th>Spécialité / Bio</th>
              </tr>
            </thead>
            <tbody>
              {enseignants.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Aucun enseignant trouvé</td>
                </tr>
              ) : (
                enseignants.map((prof) => (
                  <tr key={prof.id}>
                    <td>
                      <span className="badge badge-success">{prof.matricule}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {prof.profil.nom} {prof.profil.prenom}
                    </td>
                    <td>{prof.profil.telephone || '-'}</td>
                    <td>{prof.biographie || '-'}</td>
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
