import api from './api';
import { Classe, Niveau } from '@/types';

export interface CreateClassePayload {
  nom: string;
  niveauId: number;
  enseignantPrincipalId: number;
  anneeScolaire: string;
  capaciteMax: number;
}

export const classeService = {
  getClasses: async (): Promise<Classe[]> => {
    const response = await api.get<Classe[]>('/classes');
    return response.data;
  },

  getNiveaux: async (): Promise<Niveau[]> => {
    try {
      const response = await api.get<Niveau[]>('/niveaux');
      return response.data;
    } catch (_) {
      return [
        { id: 1, nom: 'Fondamental (7ème - 9ème DEF)' },
        { id: 2, nom: 'Lycée Secondaire Général (10ème - Terminale)' }
      ];
    }
  },

  createClasse: async (data: CreateClassePayload): Promise<Classe> => {
    const response = await api.post<Classe>('/classes', data);
    return response.data;
  }
};
