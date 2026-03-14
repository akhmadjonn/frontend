'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api-client';
import { useEffect } from 'react';

export function useAuth() {
  const { isAuthenticated, user } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user }))
  );
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (isAuthenticated && !user) {
      apiClient.get('/auth/me').then((u) => {
        setUser(u as any);
      }).catch(() => {
        logout();
      });
    }
  }, [isAuthenticated, user, setUser, logout]);

  return { isAuthenticated, user, logout, setUser };
}
