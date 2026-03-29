'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/auth-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useLocale } from '@/hooks/use-locale';
import StatsCards from '@/components/progress/stats-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, BookOpen, RefreshCw, Flame, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AccuracyChart = dynamic(() => import('@/components/progress/accuracy-chart-switcher'), {
  ssr: false,
  loading: () => <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>,
});

const CategoryChart = dynamic(() => import('@/components/progress/category-chart-switcher'), {
  ssr: false,
  loading: () => <Card><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>,
});

const DailyActivity = dynamic(() => import('@/components/progress/daily-activity'), {
  ssr: false,
  loading: () => <Card><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>,
});

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { dashboard, categories, loading, fetch } = useDashboardStore();
  const { ts } = useLocale();

  useEffect(() => { fetch(); }, [fetch]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return ts('dashboard.greetingMorning');
    if (h < 18) return ts('dashboard.greetingAfternoon');
    return ts('dashboard.greetingEvening');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{greeting()}{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
          <p className="text-sm text-muted-foreground mt-1">{ts('dashboard.readyToday')}</p>
        </div>
        {dashboard?.currentStreak && dashboard.currentStreak > 0 ? (
          <div className="flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">{dashboard.currentStreak} {ts('common.days')}</span>
          </div>
        ) : null}
      </div>

      <StatsCards data={dashboard ?? undefined} loading={loading} />

      <DailyActivity
        accuracyData={dashboard?.accuracyOverTime}
        questionsToday={dashboard?.questionsAnsweredToday}
        loading={loading}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <AccuracyChart data={dashboard?.accuracyOverTime} loading={loading} totalExams={dashboard?.totalExamsTaken} />
        <CategoryChart data={categories ?? []} loading={loading} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{ts('dashboard.recentExams')}</CardTitle>
          <Link href="/exam" className="text-xs text-primary hover:underline">{ts('common.all')}</Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : !dashboard?.recentExams.length ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{ts('dashboard.noExamsYet')}</p>
              <Link href="/exam">
                <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                  {ts('dashboard.startFirstExam')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboard.recentExams.map((exam) => (
                <Link key={exam.examId} href={`/exam/result/${exam.examId}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                      exam.passed
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {exam.passed
                        ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium">{exam.score}% {ts('dashboard.score')}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(exam.completedAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${
                    exam.passed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {exam.passed ? ts('dashboard.passed') : ts('dashboard.failed')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/exam">
          <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" size="lg">
            <GraduationCap className="h-4 w-4" />{ts('dashboard.startExam')}
          </Button>
        </Link>
        <Link href="/practice">
          <Button variant="outline" className="w-full gap-2" size="lg"><BookOpen className="h-4 w-4" />{ts('dashboard.startPractice')}</Button>
        </Link>
        <Link href="/practice">
          <Button variant="outline" className="w-full gap-2" size="lg">
            <RefreshCw className="h-4 w-4" />{ts('dashboard.review')}
            {dashboard?.dueForReview ? (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-100 px-1.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                {dashboard.dueForReview}
              </span>
            ) : null}
          </Button>
        </Link>
      </div>
    </div>
  );
}
