'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

const TOKEN_KEY = 'avtolider:accessToken';

const PUBLIC_PATHS = [
  '/fines',
  '/hazard-labels',
  '/first-aid',
  '/glossary',
  '/color-vision',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [verified, setVerified] = useState(false);
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (isPublic) { setVerified(true); return; }

    let cancelled = false;

    const verify = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (cancelled) return;
        logout();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      apiClient.updateToken(token);
      try {
        const me = await apiClient.get('/auth/me');
        if (cancelled) return;
        setUser(me as any);
        setVerified(true);
      } catch {
        if (cancelled) return;
        logout();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    setVerified(false);
    void verify();

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setVerified(false);
        void verify();
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [pathname, isPublic, router, setUser, logout]);

  if (isPublic) return <>{children}</>;
  if (!verified) return null;
  if (requireAdmin && user?.role !== 'admin') {
    router.replace('/dashboard');
    return null;
  }

  return <>{children}</>;
}
