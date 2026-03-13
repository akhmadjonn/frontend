'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requireAdmin && user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, requireAdmin, router, pathname]);

  if (!isAuthenticated) return null;
  if (requireAdmin && user?.role !== 'admin') return null;

  return <>{children}</>;
}
