'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Marathon is handled via the exam flow (StartMarathon endpoint)
// Redirect to exam page with marathon mode hint
export default function MarathonPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/exam');
  }, [router]);

  return null;
}
