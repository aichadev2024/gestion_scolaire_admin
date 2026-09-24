import api from './api';

export type TypeSujet = 'DEVOIR' | 'EXAMEN';
export type StatutSujet = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export interface SujetDevoir {
  id: number;
  classeMatiereId: number;
  classeNom?: string | null;
  matiereNom?: string | null;
  enseignantNom?: string | null;
  type: TypeSujet;
  titre: string;
  description?: string | null;
  url: string;
  contentType?: string | null;
  tailleOctets?: number | null;
  statut: StatutSujet;
  commentaireDirection?: string | null;
  traitePar?: string | null;
  dateEnvoi: string;
  dateTraitement?: string | null;
}

export const sujetDevoirService = {
  /** Direction/secrétariat — tous les sujets de l'établissement, éventuellement filtrés par statut. */
  lister: async (statut?: StatutSujet): Promise<SujetDevoir[]> =>
    (await api.get<SujetDevoir[]>('/sujets-devoirs', { params: statut ? { statut } : undefined })).data,

  /** Direction — valide ou rejette un sujet, avec un commentaire facultatif. */
  traiter: async (id: number, statut: 'VALIDE' | 'REJETE', commentaire?: string): Promise<SujetDevoir> =>
    (await api.patch<SujetDevoir>(`/sujets-devoirs/${id}/traiter`, { statut, commentaire })).data,

  /**
   * Octets du fichier, relayés par le backend (déjà authentifié) — le bucket R2 ne renvoie pas
   * d'en-têtes CORS, un lien direct ne permet donc ni de forcer un téléchargement fiable, ni de
   * lire les octets nécessaires à l'impression.
   */
  telechargerFichier: async (id: number): Promise<Blob> =>
    (await api.get(`/sujets-devoirs/${id}/fichier`, { responseType: 'blob' })).data,
};
