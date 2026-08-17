import api from './api';

export interface PresencePayload {
  eleveId: number;
  classeMatiereId?: number;
  date: string; // "2026-08-03"
  statut: 'PRESENT' | 'ABSENT' | 'RETARD';
  estJustifie?: boolean;
  notesJustification?: string;
}

export interface PresenceItem {
  id: number;
  date: string;
  statut: string;
  estJustifie: boolean;
  notesJustification: string;
  eleve: {
    id: number;
    matricule: string;
    profil: { nom: string; prenom: string };
  };
  classeMatiere?: {
    id: number;
    matiere: { nom: string };
  };
}

export interface PresenceEnseignantPayload {
  enseignantId: number;
  date: string;
  statut: 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE';
  heureArrivee?: string;
  heureDepart?: string;
  remarques?: string;
}

export interface PresenceEnseignantItem {
  id: number;
  date: string;
  statut: string;
  heureArrivee?: string;
  heureDepart?: string;
  remarques?: string;
  enseignant: {
    id: number;
    matricule: string;
    profil: { nom: string; prenom: string; telephone?: string };
  };
}

export const presenceService = {
  getByEleve: async (eleveId: number): Promise<PresenceItem[]> => {
    const response = await api.get<PresenceItem[]>(`/presences/eleve/${eleveId}`);
    return response.data;
  },

  enregistrer: async (data: PresencePayload): Promise<PresenceItem> => {
    const response = await api.post<PresenceItem>('/presences', data);
    return response.data;
  },

  // ── Enseignants ──
  getPresencesEnseignants: async (date: string): Promise<PresenceEnseignantItem[]> => {
    const response = await api.get<PresenceEnseignantItem[]>(`/presences/enseignants?date=${date}`);
    return response.data;
  },

  enregistrerEnseignant: async (data: PresenceEnseignantPayload): Promise<PresenceEnseignantItem> => {
    const response = await api.post<PresenceEnseignantItem>('/presences/enseignants', data);
    return response.data;
  }
};
