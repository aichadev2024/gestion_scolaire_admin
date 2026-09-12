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
  etablissementLogoUrl?: string;
  etablissementDevise?: string;
  etablissementSlogan?: string;
  etablissementPlanTarifaire?: string;
  etablissementMaxEnseignants?: number;
  requiresOtp?: boolean;
  message?: string;
}

export const TOKEN_COOKIE = 'jwt_token';

type SessionUser = {
  id: number;
  username: string;
  email?: string;
  role: string;
  prenom?: string;
  nom?: string;
  etablissementId?: number;
  etablissementNom?: string;
  etablissementLogoUrl?: string;
  etablissementDevise?: string;
  etablissementSlogan?: string;
  etablissementPlanTarifaire?: string;
  etablissementMaxEnseignants?: number;
};

/** Durée de vie du cookie de session, alignée sur l'expiration du JWT (défaut 24 h). */
function tokenMaxAgeSeconds(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload?.exp) {
      const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
      if (secondsLeft > 0) return secondsLeft;
    }
  } catch {
    /* jeton illisible : on retombe sur la valeur par défaut */
  }
  return 60 * 60 * 24;
}

/**
 * Persiste la session côté client :
 *  - localStorage : lu par l'intercepteur Axios pour l'en-tête Authorization ;
 *  - cookie `jwt_token` : lu par le proxy Next (protection des routes avant rendu).
 *
 * Le cookie n'est volontairement pas `httpOnly` (Axios doit lire le jeton pour
 * l'en-tête Bearer). Le durcissement `httpOnly` + proxy BFF est prévu en Phase 3.
 */
function persistSession(token: string, user: SessionUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('jwt_token', token);
  localStorage.setItem('user_data', JSON.stringify(user));
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${tokenMaxAgeSeconds(token)}; SameSite=Lax${secure}`;
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_data');
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function userFromResponse(data: AuthResponse): SessionUser {
  return {
    id: data.utilisateurId,
    username: data.username,
    email: data.email,
    role: data.role,
    prenom: data.prenom,
    nom: data.nom,
    etablissementId: data.etablissementId,
    etablissementNom: data.etablissementNom,
    etablissementLogoUrl: data.etablissementLogoUrl,
    etablissementDevise: data.etablissementDevise,
    etablissementSlogan: data.etablissementSlogan,
    etablissementPlanTarifaire: data.etablissementPlanTarifaire,
    etablissementMaxEnseignants: data.etablissementMaxEnseignants,
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      persistSession(response.data.token, userFromResponse(response.data));
    }
    return response.data;
  },

  verifyOtp: async (utilisateurId: number, otpCode: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-otp', { utilisateurId, otpCode });
    if (response.data.token) {
      persistSession(response.data.token, userFromResponse(response.data));
    }
    return response.data;
  },

  resendOtp: async (utilisateurId: number): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/resend-otp', { utilisateurId });
    return response.data;
  },

  logout: () => {
    clearSession();
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

  resetPassword: async (data: unknown) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  changePassword: async (data: unknown) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};
