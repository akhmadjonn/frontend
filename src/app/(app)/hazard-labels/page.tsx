'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HazardLabelDto } from '@/types/content';

export default function HazardLabelsPage() {
  const { t, ts } = useLocale();
  const [labels, setLabels] = useState<HazardLabelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HazardLabelDto | null>(null);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const result = await apiClient.get<HazardLabelDto[]>('/hazard-labels');
        setLabels(result);
      } catch (err: any) {
        toast.error(err?.message || ts('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('hazardLabels.title')}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : labels.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ts('hazardLabels.noLabels')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {labels.map((label) => (
            <Card
              key={label.id}
              className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
              onClick={() => setSelected(label)}
            >
              <CardContent className="p-3">
                {label.imageUrl ? (
                  <img
                    src={label.imageUrl}
                    alt={t(label.name)}
                    className="aspect-square w-full object-contain rounded-lg bg-muted/30 mb-2"
                  />
                ) : (
                  <div className="aspect-square w-full rounded-lg bg-muted/30 flex items-center justify-center mb-2">
                    <ImageOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm font-medium leading-tight line-clamp-2">{t(label.name)}</p>
                <Badge variant="secondary" className="mt-1.5 text-xs">
                  {ts('hazardLabels.hazardClass')} {label.hazardClass}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t(selected.name)}</DialogTitle>
              <DialogDescription>
                <Badge variant="secondary" className="mt-1">
                  {ts('hazardLabels.hazardClass')} {selected.hazardClass}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selected.imageUrl && (
                <img
                  src={selected.imageUrl}
                  alt={t(selected.name)}
                  className="w-full max-h-64 object-contain rounded-lg bg-muted/30"
                />
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {ts('hazardLabels.description')}
                </p>
                <p className="text-sm leading-relaxed">{t(selected.description)}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
