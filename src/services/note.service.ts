import api from './api';
import { Note } from '@/types';

export const noteService = {
  ajouterNote: async (data: any): Promise<Note> => {
    const response = await api.post<Note>('/notes', data);
    return response.data;
  },

  getNotesEleve: async (eleveId: number): Promise<Note[]> => {
    const response = await api.get<Note[]>(`/notes/eleve/${eleveId}`);
    return response.data;
  },

  getNotesClasseMatiere: async (classeMatiereId: number): Promise<Note[]> => {
    const response = await api.get<Note[]>(`/notes/classe-matiere/${classeMatiereId}`);
    return response.data;
  }
};
