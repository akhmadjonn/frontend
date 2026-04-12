'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronRight, Target, CheckCircle2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: { uz: string; uzLatin: string; ru: string };
  questionCount: number;
  children?: Category[];
}

interface CategoryPerformance {
  categoryId: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  questionsInCategory: number;
  questionsPracticed: number;
}

interface CategorySelectorProps {
  onSelect: (categoryId: string) => void;
  performance?: CategoryPerformance[];
}

function accuracyColor(accuracy: number) {
  if (accuracy >= 80) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' };
  if (accuracy >= 50) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
  return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
}

export default function CategorySelector({ onSelect, performance = [] }: CategorySelectorProps) {
  const { t, ts } = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<Category[]>('/categories')
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-3"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );

  const getPerf = (id: string) => performance.find((p) => p.categoryId === id);

  return (
    <TooltipProvider delay={300}>
      <div className="grid gap-2 sm:grid-cols-2">
        {categories.map((cat) => {
          const perf = getPerf(cat.id);
          const hasPractice = perf && perf.totalAttempts > 0;
          const accuracy = hasPractice ? Math.round(perf.accuracy) : 0;
          const completionPct = hasPractice ? Math.round(perf.questionsPracticed / perf.questionsInCategory * 100) : 0;
          const colors = accuracyColor(accuracy);

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="group text-left w-full cursor-pointer"
            >
              <Card className="transition-all hover:border-foreground/20 hover:shadow-sm">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    hasPractice && completionPct >= 100
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : 'bg-blue-50 dark:bg-blue-950/30'
                  )}>
                    {hasPractice && completionPct >= 100
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      : <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t(cat.name)}</p>
                    {hasPractice ? (
                      <>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                          </div>
                          <Tooltip>
                            <TooltipTrigger className="cursor-help shrink-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Info className="h-3 w-3 text-muted-foreground/50" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              {ts('categoryStats.coverageTooltip')}
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {perf.questionsPracticed}/{perf.questionsInCategory}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-1">
                          <Tooltip>
                            <TooltipTrigger className={cn('text-[11px] font-semibold tabular-nums flex items-center gap-0.5 cursor-help', colors.text)} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Target className="h-3 w-3" />
                              {accuracy}%
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              {ts('categoryStats.accuracyTooltip')}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger className="text-[10px] text-muted-foreground cursor-help" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              {perf.correctAttempts}/{perf.totalAttempts} {ts('common.correct')}
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              {ts('categoryStats.correctTooltip')}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {cat.questionCount} {ts('common.questions')}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
