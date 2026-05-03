import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

const TOKEN_KEY = 'avtolider:accessToken';
const REFRESH_KEY = 'avtolider:refreshToken';

// Sweep any legacy un-prefixed keys left over from earlier builds.
// Important: never restore them — that previously caused logout to be undone
// when callers wrote to the old keys after auth-store cleared the new ones.
if (typeof window !== 'undefined') {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

interface User {
  id: string;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  hasActiveSubscription: boolean;
  preferredLanguage: 'uz' | 'uzLatin' | 'ru';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  refresh: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem(TOKEN_KEY) : false,

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    apiClient.updateToken(accessToken);
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    apiClient.updateToken(null);
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  refresh: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    apiClient.updateToken(accessToken);
    set({ accessToken, refreshToken });
  },
}));
