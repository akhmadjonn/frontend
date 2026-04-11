'use client';

import { useState, useCallback, useEffect } from 'react';
import { Star } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  questionId: string;
  initialFavorited?: boolean;
  className?: string;
}

interface FavoriteToggleDto {
  isFavorited: boolean;
}

export default function FavoriteButton({ questionId, initialFavorited, className }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const [loading, setLoading] = useState(false);

  // Sync when question changes or initialFavorited prop updates
  useEffect(() => {
    setFavorited(initialFavorited ?? false);
  }, [questionId, initialFavorited]);

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const result = await apiClient.post<FavoriteToggleDto>(`/questions/${questionId}/favorite`);
      setFavorited(result.isFavorited);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [questionId, loading]);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-all',
        'hover:bg-amber-100 dark:hover:bg-amber-900/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        loading && 'opacity-50',
        className
      )}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={cn(
          'h-4.5 w-4.5 transition-colors',
          favorited
            ? 'fill-amber-400 text-amber-400'
            : 'text-muted-foreground hover:text-amber-400'
        )}
      />
    </button>
  );
}
