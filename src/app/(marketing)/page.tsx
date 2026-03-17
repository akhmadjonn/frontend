'use client';

import { useLocale } from '@/hooks/use-locale';

export default function HomePage() {
  const { ts } = useLocale();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-xl font-bold tracking-tight">{ts('marketing.homeTitle')}</h1>
    </div>
  );
}
