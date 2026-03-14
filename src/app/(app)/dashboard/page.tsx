'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import StatsCards from '@/components/progress/stats-cards';
import AccuracyChart from '@/components/progress/accuracy-chart';
import CategoryRadar from '@/components/progress/category-radar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, BookOpen, RefreshCw, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardData {
  totalQuestionsPracticed: number;
  totalExamsTaken: number;
  averageExamScore: number;
  currentStreak: number;
  dueForReview: number;
  questionsAnsweredToday: number;
  examPassRate: number;
  recentExams: Array<{ examId: string; score: number; passed: boolean; completedAt: string }>;
  accuracyOverTime: Array<{ date: string; accuracy: number }>;
}

interface CategoryData {
  categoryId: string;
  categoryName: { uz: string; uzLatin: string; ru: string };
  accuracy: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<DashboardData>('/progress/dashboard'),
      apiClient.get<CategoryData[]>('/progress/categories'),
    ])
      .then(([dash, cats]) => { setDashboard(dash); setCategories(cats); })
      .catch(() => { /* show empty state */ })
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting()}{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Bugun ham mashq qilishga tayyor?</p>
        </div>
        {dashboard?.currentStreak && dashboard.currentStreak > 0 ? (
          <div className="flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">{dashboard.currentStreak} kun</span>
          </div>
        ) : null}
      </div>

      <StatsCards data={dashboard ?? undefined} loading={loading} />

      <div className="grid gap-4 md:grid-cols-2">
        <AccuracyChart data={dashboard?.accuracyOverTime} loading={loading} />
        <CategoryRadar data={categories} loading={loading} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Oxirgi imtihonlar</CardTitle>
          <Link href="/exam" className="text-xs text-primary hover:underline">Barchasi</Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !dashboard?.recentExams.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Hali imtihon olinmagan</p>
          ) : (
            <div className="space-y-2">
              {dashboard.recentExams.map((exam) => (
                <Link key={exam.examId} href={`/exam/result/${exam.examId}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{exam.score}% ball</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(exam.completedAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <Badge variant={exam.passed ? 'default' : 'destructive'} className="shrink-0">
                    {exam.passed ? "O'tdi" : "O'tmadi"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/exam">
          <Button className="w-full gap-2" size="lg"><GraduationCap className="h-4 w-4" />Imtihon boshlash</Button>
        </Link>
        <Link href="/practice">
          <Button variant="outline" className="w-full gap-2" size="lg"><BookOpen className="h-4 w-4" />Mashq qilish</Button>
        </Link>
        <Link href="/practice">
          <Button variant="outline" className="w-full gap-2" size="lg">
            <RefreshCw className="h-4 w-4" />Takrorlash
            {dashboard?.dueForReview ? <Badge variant="secondary" className="ml-1">{dashboard.dueForReview}</Badge> : null}
          </Button>
        </Link>
      </div>
    </div>
  );
}
