import api from './api';
import { Niveau } from '@/types';

export const niveauService = {
  lister: async (): Promise<Niveau[]> => {
    const response = await api.get<Niveau[]>('/niveaux');
    return response.data;
  },

  creer: async (nom: string): Promise<Niveau> => {
    const response = await api.post<Niveau>('/niveaux', { nom });
    return response.data;
  },
};
