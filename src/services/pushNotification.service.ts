import api from './api';

export const pushNotificationService = {
  enregistrerToken: async (token: string, plateforme: 'WEB'): Promise<void> => {
    await api.post('/utilisateurs/device-token', { token, plateforme });
  },
};
