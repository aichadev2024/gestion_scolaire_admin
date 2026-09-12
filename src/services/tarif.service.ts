import api from './api';

export interface TarifPlan {
  code: string;
  prixMensuel: number;
  /** Limite de comptes enseignants pour ce plan — null/undefined = illimité. */
  maxEnseignants?: number | null;
}

export const tarifService = {
  listerTous: async (): Promise<TarifPlan[]> => {
    const response = await api.get<TarifPlan[]>('/super-admin/tarifs');
    return response.data;
  },

  modifierPlan: async (code: string, prixMensuel: number, maxEnseignants: number | null): Promise<TarifPlan> => {
    const response = await api.put<TarifPlan>(`/super-admin/tarifs/${code}`, { prixMensuel, maxEnseignants });
    return response.data;
  },
};
