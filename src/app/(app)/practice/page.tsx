'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import CategorySelector from '@/components/practice/category-selector';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Video } from 'lucide-react';

interface CategoryPerformance {
  categoryId: string;
  categoryName: { uz: string; uzLatin: string; ru: string };
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  questionsInCategory: number;
  questionsPracticed: number;
}

export default function LessonsPage() {
  const router = useRouter();
  const { ts } = useLocale();
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<CategoryPerformance[]>('/progress/categories')
      .then((cats) => setCategories(cats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/practice/session?categoryId=${categoryId}`);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('lessons.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('lessons.subtitle')}</p>
      </div>

      {/* Video Lessons Placeholder — future content */}
      <Card className="rounded-xl border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 mb-4">
            <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-semibold mb-1">{ts('lessons.comingSoon')}</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            {ts('lessons.comingSoonDesc')}
          </p>
        </CardContent>
      </Card>

      {/* Categories Section — kept from original practice page */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ts('lessons.categoriesTitle')}</h2>
        <CategorySelector onSelect={handleCategorySelect} performance={categories} />
      </div>
    </div>
  );
}
