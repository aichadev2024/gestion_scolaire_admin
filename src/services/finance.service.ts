import api from './api';
import { FraisScolarite, Paiement, RetardPaiement } from '@/types';

export interface CreateFraisPayload {
  classeId: number;
  titre: string;
  montant: number;
  dateEcheance: string;
}

export interface CreatePaiementPayload {
  eleveId: number;
  /** Absent = paiement global : réparti automatiquement par le backend sur les échéances les plus anciennes. */
  fraisId?: number;
  montantPaye: number;
  modePaiement: string;
  referenceTransaction: string;
}

export interface LigneSituation {
  fraisId: number;
  titre: string;
  type: string;
  montant: number;
  paye: number;
  reste: number;
  dateEcheance: string;
  statut: 'PAYE' | 'PARTIEL' | 'A_PAYER' | 'EN_RETARD';
}

export interface SituationFinanciere {
  devise: string;
  totalDu: number;
  totalPaye: number;
  reste: number;
  aucunFraisDefini: boolean;
  toutPaye: boolean;
  creditNonUtilise: number;
  lignes: LigneSituation[];
}

export const financeService = {
  getSituation: async (eleveId: number): Promise<SituationFinanciere> => {
    const response = await api.get<SituationFinanciere>(`/paiements/eleve/${eleveId}/situation`);
    return response.data;
  },

  getFraisByClasse: async (classeId: number): Promise<FraisScolarite[]> => {
    const response = await api.get<FraisScolarite[]>(`/frais-scolarite/classe/${classeId}`);
    return response.data;
  },

  getAllFrais: async (): Promise<FraisScolarite[]> => {
    const response = await api.get<FraisScolarite[]>('/frais-scolarite');
    return response.data;
  },

  createFrais: async (data: CreateFraisPayload): Promise<FraisScolarite> => {
    const response = await api.post<FraisScolarite>('/frais-scolarite', data);
    return response.data;
  },

  updateFrais: async (id: number, data: CreateFraisPayload): Promise<FraisScolarite> => {
    const response = await api.put<FraisScolarite>(`/frais-scolarite/${id}`, data);
    return response.data;
  },

  deleteFrais: async (id: number): Promise<void> => {
    await api.delete(`/frais-scolarite/${id}`);
  },

  getPaiementsByEleve: async (eleveId: number): Promise<Paiement[]> => {
    const response = await api.get<Paiement[]>(`/paiements/eleve/${eleveId}`);
    return response.data;
  },

  createPaiement: async (data: CreatePaiementPayload): Promise<Paiement> => {
    const response = await api.post<Paiement>('/paiements', data);
    return response.data;
  },

  getRetardsPaiement: async (): Promise<RetardPaiement[]> => {
    const response = await api.get<RetardPaiement[]>('/paiements/retards');
    return response.data;
  },

  telechargerRecuPdf: async (numeroRecu: string): Promise<Blob> => {
    const response = await api.get(`/paiements/recu/${numeroRecu}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
