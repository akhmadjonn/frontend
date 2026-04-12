import { create } from 'zustand';

const TOKEN_KEY = 'avtolider:accessToken';
const REFRESH_KEY = 'avtolider:refreshToken';

// Migrate from old keys to namespaced keys (one-time, backward compatible)
function migrateTokenKeys() {
  if (typeof window === 'undefined') return;
  for (const [oldKey, newKey] of [['accessToken', TOKEN_KEY], ['refreshToken', REFRESH_KEY]] as const) {
    const old = localStorage.getItem(oldKey);
    if (old && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, old);
      localStorage.removeItem(oldKey);
    } else if (old && localStorage.getItem(newKey)) {
      localStorage.removeItem(oldKey);
    }
  }
}

if (typeof window !== 'undefined') migrateTokenKeys();

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
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  refresh: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    set({ accessToken, refreshToken });
  },
}));
