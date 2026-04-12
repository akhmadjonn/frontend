'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Ruler, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadMarkingDto } from '@/types/content';

export default function RoadMarkingsPage() {
  const { t, ts } = useLocale();
  const [markings, setMarkings] = useState<RoadMarkingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('1');
  const [selected, setSelected] = useState<RoadMarkingDto | null>(null);

  const fetchMarkings = async (type: string) => {
    setLoading(true);
    try {
      const result = await apiClient.get<RoadMarkingDto[]>(`/road-markings?type=${type}`);
      setMarkings(result);
    } catch (err: any) {
      toast.error(err?.message || ts('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkings(activeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setSelected(null);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('roadMarkings.title')}</h1>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTypeChange('1')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
            activeType === '1'
              ? 'bg-[oklch(0.588_0.158_241)] text-white border-[oklch(0.588_0.158_241)]'
              : 'bg-background hover:bg-muted border-border'
          )}
        >
          {ts('roadMarkings.horizontal')}
        </button>
        <button
          onClick={() => handleTypeChange('2')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
            activeType === '2'
              ? 'bg-[oklch(0.588_0.158_241)] text-white border-[oklch(0.588_0.158_241)]'
              : 'bg-background hover:bg-muted border-border'
          )}
        >
          {ts('roadMarkings.vertical')}
        </button>
      </div>

      {/* Markings grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : markings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Ruler className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ts('roadMarkings.noMarkings')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {markings.map((marking) => (
            <Card
              key={marking.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.015]"
              onClick={() => setSelected(marking)}
            >
              <CardContent className="p-3">
                {marking.thumbnailUrl || marking.imageUrl ? (
                  <img
                    src={marking.thumbnailUrl || marking.imageUrl!}
                    alt={t(marking.name)}
                    className="aspect-square w-full object-contain rounded-xl bg-muted/30 mb-2"
                  />
                ) : (
                  <div className="aspect-square w-full rounded-xl bg-muted/30 flex items-center justify-center mb-2">
                    <ImageOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm font-medium leading-tight line-clamp-2">{t(marking.name)}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{marking.markingCode}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t(selected.name)}</DialogTitle>
              <DialogDescription>
                <span className="font-mono text-xs">{ts('roadMarkings.markingCode')}: {selected.markingCode}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {(selected.imageUrl || selected.thumbnailUrl) && (
                <img
                  src={selected.imageUrl || selected.thumbnailUrl!}
                  alt={t(selected.name)}
                  className="w-full max-h-64 object-contain rounded-lg bg-muted/30"
                />
              )}
              {selected.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {ts('roadMarkings.description')}
                  </p>
                  <p className="text-sm leading-relaxed">{t(selected.description)}</p>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
