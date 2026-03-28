'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronDown, ChevronUp, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FineDto, PaginatedList } from '@/types/content';

function formatPenalty(amountTiyins: number, maxTiyins: number | null): string {
  const min = (amountTiyins / 100).toLocaleString('uz-UZ');
  if (maxTiyins) {
    const max = (maxTiyins / 100).toLocaleString('uz-UZ');
    return `${min} — ${max} so'm`;
  }
  return `${min} so'm`;
}

export default function FinesPage() {
  const { t, ts } = useLocale();
  const [fines, setFines] = useState<FineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => { mounted.current = true; }, []);

  const fetchFines = async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '20' });
      if (q.trim()) params.set('search', q.trim());
      const result = await apiClient.get<PaginatedList<FineDto>>(`/fines?${params}`);
      setFines(result.items);
      setTotalPages(result.meta.totalPages);
    } catch {
      toast.error(ts('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!mounted.current) return;
    const timeout = setTimeout(() => {
      setPage(1);
      fetchFines(1, search);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('fines.title')}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={ts('fines.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : fines.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ts('fines.noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fines.map((fine) => {
            const isExpanded = expandedId === fine.id;
            return (
              <Card
                key={fine.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  isExpanded && 'ring-1 ring-primary/20'
                )}
                onClick={() => toggleExpand(fine.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {ts('fines.articleNumber')} {fine.articleNumber}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{t(fine.violationDescription)}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {ts('fines.penalty')}: {formatPenalty(fine.penaltyAmountTiyins, fine.penaltyMaxTiyins)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (fine.additionalNotes || fine.imageUrl) && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {fine.additionalNotes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {ts('fines.additionalNotes')}
                          </p>
                          <p className="text-sm">{t(fine.additionalNotes)}</p>
                        </div>
                      )}
                      {fine.imageUrl && (
                        <img
                          src={fine.imageUrl}
                          alt={t(fine.violationDescription)}
                          className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {ts('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            {ts('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
