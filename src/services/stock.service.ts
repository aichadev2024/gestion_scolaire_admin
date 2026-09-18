import api from './api';

export interface ArticleStock {
  id: number;
  nom: string;
  categorie?: string | null;
  unite: string;
  seuilAlerte: number;
  quantite: number;
  enAlerte: boolean;
}

export interface ArticleStockPayload {
  nom: string;
  categorie?: string;
  unite?: string;
  seuilAlerte?: number;
}

export type TypeMouvement = 'ENTREE' | 'SORTIE';

export interface MouvementStock {
  id: number;
  articleId: number;
  type: TypeMouvement;
  quantite: number;
  date: string;
  motif?: string | null;
  beneficiaire?: string | null;
  enregistreParNom?: string | null;
}

export interface MouvementStockPayload {
  articleId: number;
  type: TypeMouvement;
  quantite: number;
  date?: string;
  motif?: string;
  beneficiaire?: string;
}

export const stockService = {
  listerArticles: async (): Promise<ArticleStock[]> => {
    const response = await api.get<ArticleStock[]>('/stock/articles');
    return response.data;
  },

  creerArticle: async (data: ArticleStockPayload): Promise<ArticleStock> => {
    const response = await api.post<ArticleStock>('/stock/articles', data);
    return response.data;
  },

  modifierArticle: async (id: number, data: ArticleStockPayload): Promise<ArticleStock> => {
    const response = await api.put<ArticleStock>(`/stock/articles/${id}`, data);
    return response.data;
  },

  supprimerArticle: async (id: number): Promise<void> => {
    await api.delete(`/stock/articles/${id}`);
  },

  listerMouvements: async (articleId: number): Promise<MouvementStock[]> => {
    const response = await api.get<MouvementStock[]>(`/stock/articles/${articleId}/mouvements`);
    return response.data;
  },

  enregistrerMouvement: async (data: MouvementStockPayload): Promise<MouvementStock> => {
    const response = await api.post<MouvementStock>('/stock/mouvements', data);
    return response.data;
  },
};
