import api from './api';

export interface LoginCredentials {
  identifiant: string;
  motDePasse: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  utilisateurId: number;
  email?: string;
  username: string;
  role: string;
  prenom?: string;
  nom?: string;
  etablissementId?: number;
  etablissementNom?: string;
  requiresOtp?: boolean;
  message?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify({
        id: response.data.utilisateurId,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
        prenom: response.data.prenom,
        nom: response.data.nom,
        etablissementId: response.data.etablissementId,
        etablissementNom: response.data.etablissementNom
      }));
    }
    return response.data;
  },

  verifyOtp: async (utilisateurId: number, otpCode: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-otp', { utilisateurId, otpCode });
    if (response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify({
        id: response.data.utilisateurId,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
        prenom: response.data.prenom,
        nom: response.data.nom,
        etablissementId: response.data.etablissementId,
        etablissementNom: response.data.etablissementNom
      }));
    }
    return response.data;
  },

  resendOtp: async (utilisateurId: number): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/resend-otp', { utilisateurId });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('jwt_token');
    }
    return false;
  },
  
  checkSetup: async () => {
    const response = await api.get('/auth/check-setup');
    return response.data; // { setupRequired: boolean }
  },

  checkSuperAdminExists: async () => {
    const response = await api.get('/auth/check-super-admin');
    return response.data; // { exists: boolean }
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: any) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  }
};
