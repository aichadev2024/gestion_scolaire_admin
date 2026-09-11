import api from './api';

export interface TarifPlan {
  code: string;
  prixMensuel: number;
}

export const tarifService = {
  listerTous: async (): Promise<TarifPlan[]> => {
    const response = await api.get<TarifPlan[]>('/super-admin/tarifs');
    return response.data;
  },

  modifierPrix: async (code: string, prixMensuel: number): Promise<TarifPlan> => {
    const response = await api.put<TarifPlan>(`/super-admin/tarifs/${code}`, { prixMensuel });
    return response.data;
  },
};
