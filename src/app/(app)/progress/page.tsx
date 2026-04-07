'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from '@/hooks/use-locale';
import { useDashboardStore } from '@/stores/dashboard-store';
import StatsCards from '@/components/progress/stats-cards';
import StreakCalendar from '@/components/progress/streak-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, ChevronUp, ChevronDown, Target, CalendarCheck, RefreshCw, BookOpen } from 'lucide-react';

const AccuracyChart = dynamic(() => import('@/components/progress/accuracy-chart-switcher'), {
  ssr: false,
  loading: () => <Card className="card-hover"><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>,
});

const CategoryChart = dynamic(() => import('@/components/progress/category-chart-switcher'), {
  ssr: false,
  loading: () => <Card className="card-hover"><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>,
});

type SortKey = 'name' | 'accuracy' | 'progress' | 'attempts';
type SortDir = 'asc' | 'desc';

export default function ProgressPage() {
  const { t, ts } = useLocale();
  const { dashboard, categories, loading, fetch } = useDashboardStore();
  const [sortKey, setSortKey] = useState<SortKey>('accuracy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => { fetch(); }, [fetch]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedCategories = useMemo(() => {
    const sorted = [...(categories ?? [])];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = t(a.categoryName).localeCompare(t(b.categoryName)); break;
        case 'accuracy': cmp = a.accuracy - b.accuracy; break;
        case 'progress': {
          const pa = a.questionsInCategory > 0 ? a.questionsPracticed / a.questionsInCategory : 0;
          const pb = b.questionsInCategory > 0 ? b.questionsPracticed / b.questionsInCategory : 0;
          cmp = pa - pb;
          break;
        }
        case 'attempts': cmp = a.totalAttempts - b.totalAttempts; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [categories, sortKey, sortDir, t]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('progress.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('progress.subtitle')}</p>
      </div>

      <StatsCards data={dashboard ?? undefined} loading={loading} />

      {!loading && dashboard && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ts('progress.averageScore')}</p>
                  <p className="text-lg font-bold tabular-nums">{Math.round(dashboard.averageExamScore)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30 shrink-0">
                  <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ts('progress.answersToday')}</p>
                  <p className="text-lg font-bold tabular-nums">{dashboard.questionsAnsweredToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
                  <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ts('progress.needReview')}</p>
                  <p className="text-lg font-bold tabular-nums">{dashboard.dueForReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 shrink-0">
                  <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ts('progress.totalQuestions')}</p>
                  <p className="text-lg font-bold tabular-nums">{dashboard.totalQuestionsPracticed.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <AccuracyChart data={dashboard?.accuracyOverTime} loading={loading} totalExams={dashboard?.totalExamsTaken} />
        <CategoryChart data={categories ?? []} loading={loading} />
      </div>

      <StreakCalendar data={dashboard?.accuracyOverTime} loading={loading} />

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{ts('progress.categoryResults')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !categories?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{ts('common.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-2">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                        {ts('progress.category')} <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="text-right py-2 px-2">
                      <button onClick={() => toggleSort('accuracy')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto">
                        {ts('progress.accuracy')} <SortIcon col="accuracy" />
                      </button>
                    </th>
                    <th className="text-right py-2 px-2 hidden sm:table-cell">
                      <button onClick={() => toggleSort('progress')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto">
                        {ts('progress.coverage')} <SortIcon col="progress" />
                      </button>
                    </th>
                    <th className="text-right py-2 pl-2 hidden md:table-cell">
                      <button onClick={() => toggleSort('attempts')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto">
                        {ts('progress.attempts')} <SortIcon col="attempts" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((cat) => {
                    const progress = cat.questionsInCategory > 0 ? Math.round((cat.questionsPracticed / cat.questionsInCategory) * 100) : 0;
                    return (
                      <tr key={cat.categoryId} className="border-b border-border/50 last:border-0 hover:bg-muted/30 rounded-lg transition-colors">
                        <td className="py-2 pr-2">
                          <p className="font-medium truncate max-w-[200px]">{t(cat.categoryName)}</p>
                          <p className="text-[10px] text-muted-foreground sm:hidden">{progress}% {ts('progress.coverageLower')}</p>
                        </td>
                        <td className="text-right py-2 px-2 tabular-nums">
                          <div className="flex items-center justify-end gap-2">
                            <div className="hidden sm:block w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cat.accuracy >= 80 ? 'bg-green-500' : cat.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(cat.accuracy, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${cat.accuracy >= 80 ? 'text-green-600 dark:text-green-400' : cat.accuracy >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                              {Math.round(cat.accuracy)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-2 px-2 tabular-nums hidden sm:table-cell">
                          <span className="text-xs">{cat.questionsPracticed}/{cat.questionsInCategory}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">({progress}%)</span>
                        </td>
                        <td className="text-right py-2 pl-2 tabular-nums hidden md:table-cell">
                          <span className="text-xs">{cat.totalAttempts.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
