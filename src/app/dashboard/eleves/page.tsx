'use client';

import { useEffect, useState } from 'react';
import { eleveService } from '@/services/eleve.service';
import { classeService } from '@/services/classe.service';
import { utilisateurService, UtilisateurResponse } from '@/services/utilisateur.service';
import { Eleve, Classe } from '@/types';

export default function ElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [parents, setParents] = useState<UtilisateurResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    genre: 'M',
    dateNaissance: '',
    adresse: '',
    classeId: '',
    parentId: '',
    photoUrl: ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 2 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openNewForm = () => {
    setEditingEleve(null);
    setFormData({ prenom: '', nom: '', telephone: '', email: '', genre: 'M', dateNaissance: '', adresse: '', classeId: '', parentId: '', photoUrl: '' });
    setShowForm(true);
  };

  const openEditForm = (eleve: Eleve) => {
    setEditingEleve(eleve);
    setFormData({
      prenom: eleve.profil?.prenom || '',
      nom: eleve.profil?.nom || '',
      telephone: eleve.profil?.telephone || '',
      email: eleve.profil?.email || '',
      genre: (eleve.profil?.genre as 'M' | 'F') || 'M',
      dateNaissance: eleve.profil?.dateNaissance || '',
      adresse: eleve.profil?.adresse || '',
      classeId: eleve.classeId ? String(eleve.classeId) : '',
      parentId: (eleve as any).parentId ? String((eleve as any).parentId) : '',
      photoUrl: eleve.profil?.photoUrl || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [elevesData, classesData, usersData] = await Promise.all([
        eleveService.getEleves(),
        classeService.getClasses(),
        utilisateurService.getAll()
      ]);
      setEleves(elevesData);
      setClasses(classesData);
      const parentsList = usersData.filter(u => u.role === 'PARENT');
      setParents(parentsList);
    } catch (err) {
      console.error("Erreur lors du chargement des données", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        profil: {
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          email: formData.email,
          genre: formData.genre as 'M' | 'F',
          dateNaissance: formData.dateNaissance,
          adresse: formData.adresse,
          photoUrl: formData.photoUrl
        },
        classeId: formData.classeId ? parseInt(formData.classeId) : undefined,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined
      };

      if (editingEleve) {
        await eleveService.updateEleve(editingEleve.id, payload);
      } else {
        await eleveService.createEleve(payload);
      }
      setFormData({ prenom: '', nom: '', telephone: '', email: '', genre: 'M', dateNaissance: '', adresse: '', classeId: '', parentId: '', photoUrl: '' });
      setEditingEleve(null);
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde de l'élève");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestion des Élèves</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {loading ? '...' : `${eleves.length} élève(s) inscrit(s)`}
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto' }}
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingEleve(null);
            } else {
              openNewForm();
            }
          }}
        >
          {showForm ? '✕ Annuler' : '+ Nouvel Élève'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary-color)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingEleve ? "✏️ Modifier les Informations & Photo de l'Élève" : "🎓 Ajouter un Élève"}
          </h2>
          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(238, 93, 80, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Prénom *</label>
              <input type="text" name="prenom" className="input-field" value={formData.prenom} onChange={handleInputChange} placeholder="Ex: Fatoumata" required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nom *</label>
              <input type="text" name="nom" className="input-field" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Diarra" required />
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
              <input type="text" name="telephone" className="input-field" value={formData.telephone} onChange={handleInputChange} placeholder="Ex: +223 70 00 00 00" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Adresse Email (optionnel)</label>
              <input type="email" name="email" className="input-field" value={formData.email || ''} onChange={handleInputChange} placeholder="Ex: fatoumata.diarra@netaa-ecole.ml (optionnel)" />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Adresse</label>
              <input type="text" name="adresse" className="input-field" value={formData.adresse} onChange={handleInputChange} placeholder="Ex: Badalabougou, Bamako" />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label" style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                👨‍👩‍👧 Parent / Tuteur Légal (Liaison Application Mobile Parent)
              </label>
              <select name="parentId" className="input-field" value={formData.parentId} onChange={handleInputChange}>
                <option value="">— Aucun parent associé (Sélectionnez un parent) —</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>
                    👨‍👩‍👧 {p.profil?.prenom} {p.profil?.nom} ({p.email || p.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Photo de Profil de l'Élève (pour Carte Scolaire & Trombinoscope)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="input-field" style={{ flex: 1 }} />
                {formData.photoUrl && (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)', flexShrink: 0 }}>
                    <img src={formData.photoUrl} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Classe</label>
              <select name="classeId" className="input-field" value={formData.classeId} onChange={handleInputChange}>
                <option value="">— Sélectionnez une classe (optionnel) —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.niveauNom || 'Niveau ?'} ({c.anneeScolaire})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid rgba(163,174,209,0.3)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={isSubmitting}>
                {isSubmitting ? '⏳ Enregistrement...' : '✓ Enregistrer l\'élève'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            Chargement des élèves...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom & Prénom</th>
                <th>Genre</th>
                <th>Classe</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eleves.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
                    Aucun élève inscrit pour le moment
                  </td>
                </tr>
              ) : (
                eleves.map((eleve) => (
                  <tr key={eleve.id}>
                    <td><span className="badge badge-primary">{eleve.matricule}</span></td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#1B365D', color: '#E5A93C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
                          border: '1px solid rgba(229,169,60,0.4)'
                        }}>
                          {eleve.profil?.photoUrl ? (
                            <img src={eleve.profil.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            `${eleve.profil?.prenom?.[0] || ''}${eleve.profil?.nom?.[0] || ''}`
                          )}
                        </div>
                        <div>
                          <div>{eleve.profil.nom} {eleve.profil.prenom}</div>
                          {eleve.profil.telephone && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{eleve.profil.telephone}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{eleve.profil.genre === 'M' ? '♂ Masc.' : '♀ Fém.'}</td>
                    <td>{eleve.classeNom ? <span className="badge" style={{ backgroundColor: 'rgba(255,206,32,0.1)', color: '#d97706' }}>{eleve.classeNom}</span> : <span style={{ color: 'var(--text-secondary)' }}>-</span>}</td>
                    <td><span className="badge badge-success">{eleve.statut || 'ACTIF'}</span></td>
                    <td>
                      <button
                        onClick={() => openEditForm(eleve)}
                        style={{
                          background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)',
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                        }}
                      >
                        ✏️ Modifier / Photo
                      </button>
                    </td>
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
