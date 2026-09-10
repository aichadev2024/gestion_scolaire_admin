import api from './api';

export const profilService = {
  /** Envoie une photo (fichier image) pour un profil. Retourne l'URL publique. */
  uploadPhoto: async (profilId: number, file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<{ photoUrl: string }>(`/profils/${profilId}/photo`, form, {
      // null => axios retire l'en-tête ; le navigateur pose alors
      // "multipart/form-data; boundary=..." tout seul.
      headers: { 'Content-Type': null },
    });
    return res.data.photoUrl;
  },

  removePhoto: async (profilId: number): Promise<void> => {
    await api.delete(`/profils/${profilId}/photo`);
  },
};
