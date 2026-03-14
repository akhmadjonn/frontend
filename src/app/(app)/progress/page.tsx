'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import StatsCards from '@/components/progress/stats-cards';
import StreakCalendar from '@/components/progress/streak-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const AccuracyChart = dynamic(() => import('@/components/progress/accuracy-chart'), {
  ssr: false,
  loading: () => <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>,
});

const CategoryRadar = dynamic(() => import('@/components/progress/category-radar'), {
  ssr: false,
  loading: () => <Card><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>,
});

interface DashboardData {
  totalQuestionsPracticed: number;
  totalExamsTaken: number;
  averageExamScore: number;
  currentStreak: number;
  dueForReview: number;
  questionsAnsweredToday: number;
  examPassRate: number;
  recentExams: Array<{ examId: string; score: number; passed: boolean; completedAt: string }>;
  accuracyOverTime: Array<{ date: string; accuracy: number; questionCount?: number }>;
}

interface CategoryPerformance {
  categoryId: string;
  categoryName: { uz: string; uzLatin: string; ru: string };
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  questionsInCategory: number;
  questionsPracticed: number;
}

type SortKey = 'name' | 'accuracy' | 'progress' | 'attempts';
type SortDir = 'asc' | 'desc';

export default function ProgressPage() {
  const { t } = useLocale();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('accuracy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    Promise.all([
      apiClient.get<DashboardData>('/progress/dashboard'),
      apiClient.get<CategoryPerformance[]>('/progress/categories'),
    ])
      .then(([dash, cats]) => { setDashboard(dash); setCategories(cats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedCategories = useMemo(() => {
    const sorted = [...categories];
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Umumiy natijalar va statistika</p>
      </div>

      {/* Stats cards */}
      <StatsCards data={dashboard ?? undefined} loading={loading} />

      {/* Overall stats text */}
      {!loading && dashboard && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card><CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">O&apos;rtacha ball</p>
            <p className="text-xl font-bold mt-1">{Math.round(dashboard.averageExamScore)}%</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bugun javoblar</p>
            <p className="text-xl font-bold mt-1">{dashboard.questionsAnsweredToday}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Takrorlash kerak</p>
            <p className="text-xl font-bold mt-1">{dashboard.dueForReview}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jami savollar</p>
            <p className="text-xl font-bold mt-1">{dashboard.totalQuestionsPracticed.toLocaleString()}</p>
          </CardContent></Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AccuracyChart data={dashboard?.accuracyOverTime} loading={loading} />
        <CategoryRadar data={categories} loading={loading} />
      </div>

      {/* Streak calendar */}
      <StreakCalendar data={dashboard?.accuracyOverTime} loading={loading} />

      {/* Category breakdown table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Kategoriyalar bo&apos;yicha natijalar</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Ma&apos;lumot yo&apos;q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                        Kategoriya <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="text-right py-2 px-2">
                      <button onClick={() => toggleSort('accuracy')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto">
                        Aniqlik <SortIcon col="accuracy" />
                      </button>
                    </th>
                    <th className="text-right py-2 px-2 hidden sm:table-cell">
                      <button onClick={() => toggleSort('progress')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto">
                        Qamrov <SortIcon col="progress" />
                      </button>
                    </th>
                    <th className="text-right py-2 pl-2 hidden md:table-cell">
                      <button onClick={() => toggleSort('attempts')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto">
                        Urinishlar <SortIcon col="attempts" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((cat) => {
                    const progress = cat.questionsInCategory > 0 ? Math.round((cat.questionsPracticed / cat.questionsInCategory) * 100) : 0;
                    return (
                      <tr key={cat.categoryId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2 pr-2">
                          <p className="font-medium truncate max-w-[200px]">{t(cat.categoryName)}</p>
                          <p className="text-[10px] text-muted-foreground sm:hidden">{progress}% qamrov</p>
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
