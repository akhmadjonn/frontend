'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  const { ts } = useLocale();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">{ts('common.error')}</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {ts('common.unexpectedError')}
      </p>
      <Button onClick={reset} variant="outline">{ts('common.retry')}</Button>
    </div>
  );
}
