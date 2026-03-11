'use client';

import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { useEffect } from 'react';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (store.isAuthenticated && !store.user) {
      apiClient.get('/auth/me').then((user) => {
        store.setUser(user as any);
      }).catch(() => {
        store.logout();
      });
    }
  }, [store.isAuthenticated]);

  return store;
}
