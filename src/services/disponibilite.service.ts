import api from './api';

export type TypeDisponibilite = 'DISPONIBLE' | 'INDISPONIBLE';

export interface DisponibiliteItem {
  id: number;
  jourSemaine: number;
  heureDebut: string;
  heureFin: string;
  type: TypeDisponibilite;
  commentaire?: string | null;
}

export interface DisponibilitePayload {
  jourSemaine: number;
  heureDebut: string;
  heureFin: string;
  type: TypeDisponibilite;
  commentaire?: string;
}

export const disponibiliteService = {
  listerPourMoi: async (): Promise<DisponibiliteItem[]> => {
    const response = await api.get<DisponibiliteItem[]>('/disponibilites/moi');
    return response.data;
  },

  listerParEnseignant: async (enseignantId: number): Promise<DisponibiliteItem[]> => {
    const response = await api.get<DisponibiliteItem[]>(`/disponibilites/enseignant/${enseignantId}`);
    return response.data;
  },

  creer: async (data: DisponibilitePayload): Promise<DisponibiliteItem> => {
    const response = await api.post<DisponibiliteItem>('/disponibilites', data);
    return response.data;
  },

  supprimer: async (id: number): Promise<void> => {
    await api.delete(`/disponibilites/${id}`);
  },
};
