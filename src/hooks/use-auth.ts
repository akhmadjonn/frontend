'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api-client';
import { useEffect, useSyncExternalStore } from 'react';

// SSR sees no localStorage, so isAuthenticated boots as false. Returning the
// store value directly causes a hydration mismatch on the first paint when a
// token IS present. useSyncExternalStore gives us a server-vs-client snapshot
// without triggering setState-in-effect — server gets false, client gets the
// real value after hydration.
const noopSubscribe = () => () => {};
export function useIsAuthedAfterMount(): boolean {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useSyncExternalStore(noopSubscribe, () => isAuthenticated, () => false);
}

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
