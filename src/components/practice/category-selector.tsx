'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronRight } from 'lucide-react';

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

export default function CategorySelector({ onSelect, performance = [] }: CategorySelectorProps) {
  const { t } = useLocale();
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
          <Card key={i}><CardContent className="p-3"><Skeleton className="h-14 w-full" /></CardContent></Card>
        ))}
      </div>
    );

  const getPerf = (id: string) => performance.find((p) => p.categoryId === id);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {categories.map((cat) => {
        const perf = getPerf(cat.id);
        const progress = perf ? Math.round((perf.questionsPracticed / Math.max(perf.questionsInCategory, 1)) * 100) : 0;
        const accuracy = perf ? Math.round(perf.accuracy) : 0;

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="group text-left w-full"
          >
            <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t(cat.name)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{progress}%</span>
                  </div>
                  {perf && perf.totalAttempts > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {accuracy}% aniqlik · {perf.questionsPracticed}/{perf.questionsInCategory}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
