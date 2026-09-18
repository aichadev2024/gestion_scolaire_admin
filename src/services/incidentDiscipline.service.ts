import api from './api';

export interface IncidentDisciplinePayload {
  eleveId: number;
  classeId: number;
  classeMatiereId?: number;
  date: string; // "2026-09-18"
  heure: string; // "08:30"
  statut: 'RETARD' | 'ABSENT' | 'TENUE_NON_PORTEE' | 'REFUS_EXERCICE';
  commentaire?: string;
}

export interface IncidentDisciplineItem {
  id: number;
  date: string;
  heure: string;
  statut: string;
  commentaire?: string;
  estTraite: boolean;
  notesTraitement?: string;
  eleve: {
    id: number;
    matricule: string;
    profil: { nom: string; prenom: string };
  };
  classeMatiere?: {
    id: number;
    matiere: { nom: string };
    enseignant?: { profil: { nom: string; prenom: string } };
  };
  enregistrePar?: {
    id: number;
    username: string;
  };
}

export const incidentDisciplineService = {
  getByEleve: async (eleveId: number): Promise<IncidentDisciplineItem[]> => {
    const response = await api.get<IncidentDisciplineItem[]>(`/incidents-discipline/eleve/${eleveId}`);
    return response.data;
  },

  getByClasseDate: async (classeId: number, date: string): Promise<IncidentDisciplineItem[]> => {
    const response = await api.get<IncidentDisciplineItem[]>(`/incidents-discipline/classe/${classeId}`, { params: { date } });
    return response.data;
  },

  enregistrer: async (data: IncidentDisciplinePayload): Promise<IncidentDisciplineItem> => {
    const response = await api.post<IncidentDisciplineItem>('/incidents-discipline', data);
    return response.data;
  },

  marquerTraite: async (id: number, notesTraitement?: string): Promise<IncidentDisciplineItem> => {
    const response = await api.patch<IncidentDisciplineItem>(`/incidents-discipline/${id}/traiter`, { notesTraitement });
    return response.data;
  },
};
