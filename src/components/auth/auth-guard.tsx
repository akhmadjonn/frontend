'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

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
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isPublic = isPublicPath(pathname);
  const userLoading = isAuthenticated && !user;

  useEffect(() => {
    if (!mounted || userLoading) return;
    if (isPublic) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requireAdmin && user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [mounted, isAuthenticated, user, userLoading, requireAdmin, router, pathname, isPublic]);

  if (!mounted) return null;
  if (isPublic) return <>{children}</>;
  if (userLoading) return null;
  if (!isAuthenticated) return null;
  if (requireAdmin && user?.role !== 'admin') return null;

  return <>{children}</>;
}
