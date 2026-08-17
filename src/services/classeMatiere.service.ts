import api from './api';

export interface ClasseMatierePayload {
  classeId: number;
  matiereId: number;
  enseignantId: number;
  coefficient: number;
}

export interface ClasseMatiereItem {
  id: number;
  coefficient: number;
  classe: { id: number; nom: string };
  matiere: { id: number; nom: string; code: string };
  enseignant: { id: number; profil: { nom: string; prenom: string } };
}

export const classeMatiereService = {
  getByClasse: async (classeId: number): Promise<ClasseMatiereItem[]> => {
    const response = await api.get<ClasseMatiereItem[]>(`/classes-matieres/classe/${classeId}`);
    return response.data;
  },

  create: async (data: ClasseMatierePayload): Promise<ClasseMatiereItem> => {
    const response = await api.post<ClasseMatiereItem>('/classes-matieres', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classes-matieres/${id}`);
  }
};
