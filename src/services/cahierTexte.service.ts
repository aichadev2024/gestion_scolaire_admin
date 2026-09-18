import api from './api';

export interface SeanceCours {
  id: number;
  classeMatiereId: number;
  classeId: number;
  classeNom: string;
  matiereNom: string;
  enseignantNom?: string | null;
  date: string;
  heureDebut?: string | null;
  heureFin?: string | null;
  effectue: boolean;
  titre?: string | null;
  contenu?: string | null;
  devoirs?: string | null;
  motifNonEffectue?: string | null;
}

export interface SeancePayload {
  classeMatiereId: number;
  date: string;
  heureDebut?: string;
  heureFin?: string;
  effectue: boolean;
  titre?: string;
  contenu?: string;
  devoirs?: string;
  motifNonEffectue?: string;
}

export interface MonCours {
  classeMatiereId: number;
  classeId: number;
  classeNom: string;
  matiereNom: string;
}

export interface EffectiviteCours {
  classeMatiereId: number;
  classeNom: string;
  matiereNom: string;
  enseignantNom?: string | null;
  prevues: number;
  effectuees: number;
  nonEffectuees: number;
  nonRenseignees: number;
  tauxEffectivite: number;
}

export const cahierTexteService = {
  lister: async (classeId: number, debut: string, fin: string): Promise<SeanceCours[]> => {
    const response = await api.get<SeanceCours[]>(`/cahier-texte/classe/${classeId}`, { params: { debut, fin } });
    return response.data;
  },

  mesCours: async (): Promise<MonCours[]> => {
    const response = await api.get<MonCours[]>('/cahier-texte/mes-cours');
    return response.data;
  },

  effectivite: async (debut: string, fin: string): Promise<EffectiviteCours[]> => {
    const response = await api.get<EffectiviteCours[]>('/cahier-texte/effectivite', { params: { debut, fin } });
    return response.data;
  },

  creer: async (data: SeancePayload): Promise<SeanceCours> => {
    const response = await api.post<SeanceCours>('/cahier-texte', data);
    return response.data;
  },

  modifier: async (id: number, data: SeancePayload): Promise<SeanceCours> => {
    const response = await api.put<SeanceCours>(`/cahier-texte/${id}`, data);
    return response.data;
  },

  supprimer: async (id: number): Promise<void> => {
    await api.delete(`/cahier-texte/${id}`);
  },
};
