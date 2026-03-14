'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
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
        <h1 className="text-2xl font-bold">Mashq qilish</h1>
        <p className="text-sm text-muted-foreground mt-1">Kategoriya tanlang yoki takrorlang</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Review Due */}
        <button onClick={() => router.push('/practice/session?review=true')} className="text-left w-full">
          <Card className="transition-all hover:border-orange-300 hover:shadow-sm border-orange-200 dark:border-orange-800">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Takrorlash</p>
                {loading
                  ? <Skeleton className="h-4 w-16 mt-0.5" />
                  : <p className="text-xs text-muted-foreground">{dueCount} ta savol kutmoqda</p>
                }
              </div>
              {!loading && dueCount > 0 && (
                <Badge className="bg-orange-500 text-white shrink-0">{dueCount}</Badge>
              )}
            </CardContent>
          </Card>
        </button>

        {/* All Categories Practice */}
        <button onClick={() => router.push('/practice/session')} className="text-left w-full">
          <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Aralash mashq</p>
                <p className="text-xs text-muted-foreground">Barcha kategoriyalar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </button>

        {/* Marathon */}
        <Link href="/exam" className="w-full">
          <Card className="transition-all hover:border-purple-300 hover:shadow-sm h-full">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Maraton</p>
                <p className="text-xs text-muted-foreground">Barcha savollar, taymer yo&apos;q</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Kategoriyalar</h2>
        <CategorySelector onSelect={handleCategorySelect} performance={categories} />
      </div>
    </div>
  );
}
