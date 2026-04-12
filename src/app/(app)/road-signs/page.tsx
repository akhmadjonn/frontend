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
import { SignpostBig, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadSignCategoryDto, RoadSignDto } from '@/types/content';

export default function RoadSignsPage() {
  const { t, ts } = useLocale();
  const [categories, setCategories] = useState<RoadSignCategoryDto[]>([]);
  const [signs, setSigns] = useState<RoadSignDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSigns, setLoadingSigns] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<RoadSignDto | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await apiClient.get<RoadSignCategoryDto[]>('/road-signs/categories');
        setCategories(result);
        if (result.length > 0) {
          setActiveCategory(result[0].id);
        }
      } catch (err: any) {
        toast.error(err?.message || ts('common.error'));
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSigns = async (categoryId: string | null) => {
    setLoadingSigns(true);
    try {
      const query = categoryId ? `?categoryId=${categoryId}` : '';
      const result = await apiClient.get<RoadSignDto[]>(`/road-signs${query}`);
      setSigns(result);
    } catch (err: any) {
      toast.error(err?.message || ts('common.error'));
    } finally {
      setLoadingSigns(false);
    }
  };

  useEffect(() => {
    if (activeCategory)
      fetchSigns(activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleCategoryChange = (categoryId: string | null) => {
    setActiveCategory(categoryId);
    setSelected(null);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('roadSigns.title')}</h1>
      </div>

      {/* Category chips */}
      {loadingCategories ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => handleCategoryChange(null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border',
              activeCategory === null
                ? 'bg-[oklch(0.588_0.158_241)] text-white border-[oklch(0.588_0.158_241)]'
                : 'bg-background hover:bg-muted border-border'
            )}
          >
            {ts('roadSigns.allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border',
                activeCategory === cat.id
                  ? 'bg-[oklch(0.588_0.158_241)] text-white border-[oklch(0.588_0.158_241)]'
                  : 'bg-background hover:bg-muted border-border'
              )}
            >
              {t(cat.name)}
              <span className="ml-1.5 text-xs opacity-70">{cat.signCount}</span>
            </button>
          ))}
        </div>
      )}

      {/* Signs grid */}
      {loadingSigns ? (
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
      ) : signs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <SignpostBig className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ts('roadSigns.noSigns')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {signs.map((sign) => (
            <Card
              key={sign.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.015]"
              onClick={() => setSelected(sign)}
            >
              <CardContent className="p-3">
                {sign.thumbnailUrl || sign.imageUrl ? (
                  <img
                    src={sign.thumbnailUrl || sign.imageUrl!}
                    alt={t(sign.name)}
                    className="aspect-square w-full object-contain rounded-xl bg-muted/30 mb-2"
                  />
                ) : (
                  <div className="aspect-square w-full rounded-xl bg-muted/30 flex items-center justify-center mb-2">
                    <ImageOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm font-medium leading-tight line-clamp-2">{t(sign.name)}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{sign.signCode}</p>
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
                <span className="font-mono text-xs">{ts('roadSigns.signCode')}: {selected.signCode}</span>
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
                    {ts('roadSigns.description')}
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
