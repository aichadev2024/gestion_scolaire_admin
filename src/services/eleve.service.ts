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

export interface PromotionLigneResultat {
  eleveId: number;
  succes: boolean;
  nomComplet?: string;
  erreur?: string;
}

export interface PromotionRapport {
  totalDemandes: number;
  succes: number;
  echecs: number;
  resultats: PromotionLigneResultat[];
}

export const eleveService = {
  getEleves: async (): Promise<Eleve[]> => {
    const response = await api.get<Eleve[]>('/eleves');
    return response.data;
  },

  getElevesParClasse: async (classeId: number): Promise<Eleve[]> => {
    const response = await api.get<Eleve[]>(`/eleves/classe/${classeId}`);
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

  promouvoir: async (classeDestinationId: number, eleveIds: number[]): Promise<PromotionRapport> => {
    const response = await api.post<PromotionRapport>('/eleves/promotion', { classeDestinationId, eleveIds });
    return response.data;
  },
};
