'use client';

import Link from 'next/link';
import { useIsAuthedAfterMount } from '@/hooks/use-auth';

interface Props {
  href?: string;
  authedHref?: string;
  className?: string;
  children: React.ReactNode;
  authedChildren?: React.ReactNode;
}

// Marketing-page CTA that swaps to a different destination & label when the
// visitor is already signed in. Server components can drop it inline without
// needing to become client components themselves.
export default function AuthCtaLink({
  href = '/login',
  authedHref = '/dashboard',
  className,
  children,
  authedChildren,
}: Props) {
  const isAuthed = useIsAuthedAfterMount();
  return (
    <Link href={isAuthed ? authedHref : href} className={className}>
      {isAuthed && authedChildren !== undefined ? authedChildren : children}
    </Link>
  );
}
