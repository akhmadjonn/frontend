'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type HistoryMode = 'all' | 'exam' | 'ticket' | 'marathon' | 'speedChallenge';

interface ExamHistoryItem {
  examId: string;
  mode: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
  timeTakenSeconds: number;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const MODE_CONFIG: Record<string, { color: string; darkColor: string; textColor: string; darkTextColor: string }> = {
  exam: { color: 'bg-blue-100', darkColor: 'dark:bg-blue-900/30', textColor: 'text-blue-700', darkTextColor: 'dark:text-blue-300' },
  ticket: { color: 'bg-violet-100', darkColor: 'dark:bg-violet-900/30', textColor: 'text-violet-700', darkTextColor: 'dark:text-violet-300' },
  marathon: { color: 'bg-green-100', darkColor: 'dark:bg-green-900/30', textColor: 'text-green-700', darkTextColor: 'dark:text-green-300' },
  speedChallenge: { color: 'bg-amber-100', darkColor: 'dark:bg-amber-900/30', textColor: 'text-amber-700', darkTextColor: 'dark:text-amber-300' },
};

function ModeBadge({ mode, ts }: { mode: string; ts: (key: string) => string }) {
  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.exam;
  const label = ts(`history.mode.${mode}`);
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', config.color, config.darkColor, config.textColor, config.darkTextColor)}>
      {label}
    </span>
  );
}

export default function ExamHistoryPage() {
  const { ts } = useLocale();
  const [items, setItems] = useState<ExamHistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeMode, setActiveMode] = useState<HistoryMode>('all');

  const fetchHistory = useCallback(async (p: number, mode: HistoryMode) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '20' });
      if (mode !== 'all') params.set('mode', mode);
      const data = await apiClient.get<{ items: ExamHistoryItem[]; meta: PaginationMeta }>(`/exams/history?${params}`);
      setItems(data.items ?? []);
      setMeta(data.meta ?? null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page, activeMode);
  }, [page, activeMode, fetchHistory]);

  const handleModeChange = (mode: HistoryMode) => {
    setActiveMode(mode);
    setPage(1);
  };

  const modes: { key: HistoryMode; label: string }[] = [
    { key: 'all', label: ts('common.all') },
    { key: 'exam', label: ts('history.mode.exam') },
    { key: 'ticket', label: ts('history.mode.ticket') },
    { key: 'speedChallenge', label: ts('history.mode.speedChallenge') },
    { key: 'marathon', label: ts('history.mode.marathon') },
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{ts('history.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ts('history.subtitle')}</p>
        </div>
        <Link href="/exam">
          <Button variant="outline" size="sm">{ts('history.backToExam')}</Button>
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => handleModeChange(m.key)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              activeMode === m.key
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
                <History className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{ts('history.noHistory')}</p>
              <Link href="/exam">
                <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                  {ts('history.startExam')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.examId}
                  href={`/exam/result/${item.examId}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                      item.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    )}>
                      {item.passed
                        ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.correctAnswers}/{item.totalQuestions} ({item.score}%)</p>
                        <ModeBadge mode={item.mode} ts={ts} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}</span>
                        {item.timeTakenSeconds > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{formatTime(item.timeTakenSeconds)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {ts('common.pageOf').replace('{page}', String(page)).replace('{total}', String(meta.totalPages))}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
