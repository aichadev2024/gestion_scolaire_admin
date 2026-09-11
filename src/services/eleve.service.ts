import api from './api';
import { Eleve, Profil } from '@/types';

export interface CreateElevePayload {
  profil: Profil;
  classeId?: number;
  parentId?: number;
}

export interface EleveImportLigneResultat {
  ligne: number;
  succes: boolean;
  matricule?: string;
  nomComplet?: string;
  motDePasseInitial?: string;
  erreur?: string;
}

export interface EleveImportRapport {
  totalLignes: number;
  succes: number;
  echecs: number;
  resultats: EleveImportLigneResultat[];
}

export const eleveService = {
  getEleves: async (): Promise<Eleve[]> => {
    const response = await api.get<Eleve[]>('/eleves');
    return response.data;
  },

  createEleve: async (data: CreateElevePayload): Promise<Eleve> => {
    const response = await api.post<Eleve>('/eleves', data);
    return response.data;
  },

  updateEleve: async (id: number, data: CreateElevePayload): Promise<Eleve> => {
    const response = await api.put<Eleve>(`/eleves/${id}`, data);
    return response.data;
  },

  archiverEleve: async (id: number): Promise<void> => {
    await api.patch(`/eleves/${id}/archiver`);
  },

  modifierStatutInscription: async (id: number, statutInscription: string): Promise<Eleve> => {
    const response = await api.patch<Eleve>(`/eleves/${id}/statut-inscription`, { statutInscription });
    return response.data;
  },

  deleteEleve: async (id: number): Promise<void> => {
    await api.delete(`/eleves/${id}`);
  },

  importerExcel: async (fichier: File, classeId?: number): Promise<EleveImportRapport> => {
    const formData = new FormData();
    formData.append('fichier', fichier);
    const params = classeId ? { classeId } : undefined;
    const response = await api.post<EleveImportRapport>('/eleves/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    });
    return response.data;
  },

  telechargerModeleImport: async (): Promise<Blob> => {
    const response = await api.get('/eleves/import/modele', { responseType: 'blob' });
    return response.data;
  },
};
