import api from './api';

export interface NotificationItem {
  id: number;
  titre: string;
  contenu: string;
  estLu: boolean;
  dateCreation: string;
  reponseContenu?: string | null;
  reponseDate?: string | null;
}

export const notificationService = {
  lister: async (destinataireId: number): Promise<NotificationItem[]> =>
    (await api.get<NotificationItem[]>(`/notifications/destinataire/${destinataireId}`)).data,

  listerNonLues: async (destinataireId: number): Promise<NotificationItem[]> =>
    (await api.get<NotificationItem[]>(`/notifications/destinataire/${destinataireId}/non-lues`)).data,

  marquerLue: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/lue`);
  },

  supprimer: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  toutSupprimer: async (): Promise<void> => {
    await api.delete('/notifications');
  },

  repondre: async (id: number, contenu: string): Promise<NotificationItem> =>
    (await api.patch<NotificationItem>(`/notifications/${id}/repondre`, { contenu })).data,
};
