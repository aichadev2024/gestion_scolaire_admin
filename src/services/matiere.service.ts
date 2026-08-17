import api from './api';
import { Matiere } from '@/types';

export interface CreateMatierePayload {
  nom: string;
  code: string;
}

export const matiereService = {
  getMatieres: async (): Promise<Matiere[]> => {
    const response = await api.get<Matiere[]>('/matieres');
    return response.data;
  },

  createMatiere: async (data: CreateMatierePayload): Promise<Matiere> => {
    const response = await api.post<Matiere>('/matieres', data);
    return response.data;
  }
};
