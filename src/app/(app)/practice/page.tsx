'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import CategorySelector from '@/components/practice/category-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Zap, BookOpen, ArrowRight } from 'lucide-react';

interface CategoryPerformance {
  categoryId: string;
  categoryName: { uz: string; uzLatin: string; ru: string };
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  questionsInCategory: number;
  questionsPracticed: number;
}

export default function PracticePage() {
  const router = useRouter();
  const { ts } = useLocale();
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<CategoryPerformance[]>('/progress/categories'),
      apiClient.get<{ dueCount: number }>('/practice/due-count'),
    ])
      .then(([cats, due]) => {
        setCategories(cats);
        setDueCount(typeof due === 'number' ? due : (due as any)?.dueCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/practice/session?categoryId=${categoryId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('practice.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('practice.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={() => router.push('/practice/session?review=true')} className="text-left w-full">
          <Card className="hover:border-foreground/20 hover:shadow-sm transition-colors">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{ts('practice.review')}</p>
                {loading
                  ? <Skeleton className="h-4 w-16 mt-0.5" />
                  : <p className="text-xs text-muted-foreground">{dueCount} {ts('practice.reviewWaiting')}</p>
                }
              </div>
              {!loading && dueCount > 0 && (
                <Badge variant="secondary" className="shrink-0">{dueCount}</Badge>
              )}
            </CardContent>
          </Card>
        </button>

        <button onClick={() => router.push('/practice/session')} className="text-left w-full">
          <Card className="hover:border-foreground/20 hover:shadow-sm transition-colors">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{ts('practice.mixedPractice')}</p>
                <p className="text-xs text-muted-foreground">{ts('practice.allCategories')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </button>

        <Link href="/exam" className="w-full">
          <Card className="hover:border-foreground/20 hover:shadow-sm transition-colors h-full">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{ts('practice.marathon')}</p>
                <p className="text-xs text-muted-foreground">{ts('practice.marathonDesc')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ts('practice.categories')}</h2>
        <CategorySelector onSelect={handleCategorySelect} performance={categories} />
      </div>
    </div>
  );
}
