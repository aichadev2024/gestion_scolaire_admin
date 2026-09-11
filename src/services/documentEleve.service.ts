import api from './api';

export interface DocumentEleve {
  id: number;
  eleveId: number;
  type: 'ACTE_NAISSANCE' | 'CERTIFICAT_MEDICAL' | 'AUTRE' | string;
  libelle: string;
  url: string;
  contentType?: string;
  tailleOctets?: number;
  dateAjout?: string;
}

export const documentEleveService = {
  lister: async (eleveId: number): Promise<DocumentEleve[]> => {
    const res = await api.get<DocumentEleve[]>(`/eleves/${eleveId}/documents`);
    return res.data;
  },

  ajouter: async (eleveId: number, file: File, type: string, libelle?: string): Promise<DocumentEleve> => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    if (libelle) form.append('libelle', libelle);
    const res = await api.post<DocumentEleve>(`/eleves/${eleveId}/documents`, form, {
      // null => axios retire l'en-tête ; le navigateur pose lui-même "multipart/form-data; boundary=...".
      headers: { 'Content-Type': null },
    });
    return res.data;
  },

  supprimer: async (eleveId: number, documentId: number): Promise<void> => {
    await api.delete(`/eleves/${eleveId}/documents/${documentId}`);
  },
};
