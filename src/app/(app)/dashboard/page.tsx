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
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const AccuracyChart = dynamic(() => import('@/components/progress/accuracy-chart-switcher'), {
  ssr: false,
  loading: () => <Card className="card-hover"><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>,
});

const CategoryChart = dynamic(() => import('@/components/progress/category-chart-switcher'), {
  ssr: false,
  loading: () => <Card className="card-hover"><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>,
});

const DailyActivity = dynamic(() => import('@/components/progress/daily-activity'), {
  ssr: false,
  loading: () => <Card className="card-hover"><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>,
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
    <div className="space-y-6 animate-fade-up">
      {/* Welcome section with gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-[oklch(0.95_0.03_241)] to-[oklch(0.97_0.02_280)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{greeting()}{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{ts('dashboard.readyToday')}</p>
          </div>
          {dashboard?.currentStreak && dashboard.currentStreak > 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-orange-100/80 dark:bg-orange-900/30 px-4 py-2 shadow-sm">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{dashboard.currentStreak} {ts('common.days')}</span>
            </div>
          ) : null}
        </div>
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

      {/* Recent exams */}
      <Card className="card-hover rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">{ts('dashboard.recentExams')}</CardTitle>
          <Link href="/exam/history" className="text-xs text-[oklch(0.588_0.158_241)] hover:underline font-medium">{ts('common.all')}</Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : !dashboard?.recentExams.length ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[oklch(0.95_0.03_241)] mb-3">
                <GraduationCap className="h-6 w-6 text-[oklch(0.588_0.158_241)]" />
              </div>
              <p className="text-sm text-muted-foreground">{ts('dashboard.noExamsYet')}</p>
              <Link href="/exam">
                <Button variant="outline" size="sm" className="mt-3 gap-1.5 rounded-xl">
                  {ts('dashboard.startFirstExam')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboard.recentExams.map((exam) => (
                <Link key={exam.examId} href={`/exam/result/${exam.examId}`} className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                      exam.passed
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {exam.passed
                        ? <CheckCircle2 className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
                        : <XCircle className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold tabular-nums">{exam.score}% {ts('dashboard.score')}</p>
                        {exam.mode && (() => {
                          const modeColors: Record<string, string> = {
                            exam: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                            ticket: 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
                            marathon: 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                            speedChallenge: 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                          };
                          return (
                            <span className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold', modeColors[exam.mode] ?? modeColors.exam)}>
                              {ts(`history.mode.${exam.mode}`)}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(exam.completedAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${
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

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/exam">
          <Button className="w-full gap-2.5 rounded-xl h-12 btn-gradient-blue text-white font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 transition-all" size="lg">
            <GraduationCap className="h-5 w-5" />{ts('dashboard.startExam')}
          </Button>
        </Link>
        <Link href="/practice">
          <Button variant="outline" className="w-full gap-2.5 rounded-xl h-12 font-semibold hover:bg-muted/50" size="lg">
            <BookOpen className="h-5 w-5" />{ts('dashboard.startPractice')}
          </Button>
        </Link>
        <Link href="/practice">
          <Button variant="outline" className="w-full gap-2.5 rounded-xl h-12 font-semibold hover:bg-muted/50" size="lg">
            <RefreshCw className="h-5 w-5" />{ts('dashboard.review')}
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
