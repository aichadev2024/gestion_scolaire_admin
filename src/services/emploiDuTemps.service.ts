import api from './api';

export interface EmploiDuTempsPayload {
  classeMatiereId?: number;
  classeId?: number;
  typeCreneau?: 'COURS' | 'RECREATION' | 'DEJEUNER' | 'PAUSE';
  libellePause?: string;
  jourSemaine: number;
  heureDebut: string; // "08:00"
  heureFin: string;   // "10:00"
  salle?: string;
}

export interface EmploiDuTempsItem {
  id: number;
  jourSemaine: number;
  heureDebut: string;
  heureFin: string;
  salle?: string;
  typeCreneau?: string;
  libellePause?: string;
  classeMatiere?: {
    id: number;
    classe: { id: number; nom: string };
    matiere: { id: number; nom: string };
    enseignant: { id: number; profil: { nom: string; prenom: string } };
    coefficient: number;
  };
}

export const emploiDuTempsService = {
  getByClasse: async (classeId: number): Promise<EmploiDuTempsItem[]> => {
    const response = await api.get<EmploiDuTempsItem[]>(`/emplois-du-temps/classe/${classeId}`);
    return response.data;
  },

  create: async (data: EmploiDuTempsPayload): Promise<EmploiDuTempsItem> => {
    const response = await api.post<EmploiDuTempsItem>('/emplois-du-temps', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/emplois-du-temps/${id}`);
  }
};
