'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Admin panelda xatolik yuz berdi</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Kutilmagan xatolik yuz berdi. Sahifani qayta yuklang yoki keyinroq urinib ko&apos;ring.
      </p>
      <Button onClick={reset} variant="outline">Qayta urinish</Button>
    </div>
  );
}
