'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import type { FavoriteQuestionDto, FavoriteToggleDto } from '@/types/engagement';
import type { PaginatedList } from '@/types/content';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const difficultyConfig: Record<number, { label: string; className: string }> = {
  1: { label: 'Easy', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  2: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  3: { label: 'Hard', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const { t, ts } = useLocale();
  const [favorites, setFavorites] = useState<FavoriteQuestionDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await apiClient.get<PaginatedList<FavoriteQuestionDto>>(
        `/questions/favorites?page=${p}&pageSize=${PAGE_SIZE}`
      );
      setFavorites(data.items);
      setTotalPages(data.meta.totalPages);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(page);
  }, [page, fetchFavorites]);

  const handleUnfavorite = async (questionId: string) => {
    try {
      await apiClient.post<FavoriteToggleDto>(`/questions/${questionId}/favorite`);
      setFavorites((prev) => prev.filter((f) => f.questionId !== questionId));
      toast.success(ts('favorites.removed'));
    } catch {
      toast.error(ts('common.error'));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('favorites.title')}</h1>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-2xl bg-[oklch(0.95_0.03_241)] p-4 mb-3">
            <Heart className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{ts('favorites.empty')}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{ts('favorites.emptyDescription')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {favorites.map((fav) => {
              const diff = difficultyConfig[fav.difficulty] ?? difficultyConfig[1];
              return (
                <Card key={fav.questionId} className="card-hover rounded-xl border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug line-clamp-2">
                          {t(fav.text)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={cn('text-xs', diff.className)}>
                            {ts('favorites.difficulty')} {fav.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ts('favorites.addedAt')}: {formatDate(fav.favoritedAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnfavorite(fav.questionId)}
                        className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors hover:scale-110 transition-transform"
                        aria-label={ts('favorites.removeConfirm')}
                      >
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
