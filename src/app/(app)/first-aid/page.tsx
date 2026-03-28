'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartPulse, ChevronRight, ListChecks } from 'lucide-react';
import type { FirstAidProcedureListDto } from '@/types/content';

export default function FirstAidPage() {
  const { t, ts } = useLocale();
  const router = useRouter();
  const [procedures, setProcedures] = useState<FirstAidProcedureListDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        const result = await apiClient.get<FirstAidProcedureListDto[]>('/first-aid');
        setProcedures(result);
      } catch (err: any) {
        toast.error(err?.message || ts('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchProcedures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('firstAid.title')}</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : procedures.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <HeartPulse className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ts('firstAid.noProcedures')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {procedures.map((proc) => (
            <Card
              key={proc.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => router.push(`/first-aid/${proc.slug}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {proc.iconUrl ? (
                    <img
                      src={proc.iconUrl}
                      alt={t(proc.name)}
                      className="h-10 w-10 rounded-lg object-contain shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                      <HeartPulse className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{t(proc.name)}</p>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        <ListChecks className="h-3 w-3 mr-1" />
                        {proc.stepCount} {ts('firstAid.steps')}
                      </Badge>
                    </div>
                    {proc.summary && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {t(proc.summary)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
