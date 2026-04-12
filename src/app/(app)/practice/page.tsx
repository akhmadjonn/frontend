'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import CategorySelector from '@/components/practice/category-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, PlayCircle, CheckCircle2 } from 'lucide-react';

interface CategoryPerformance {
  categoryId: string;
  categoryName: { uz: string; uzLatin: string; ru: string };
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  questionsInCategory: number;
  questionsPracticed: number;
}

interface VideoCategoryDto {
  id: string;
  name: { uz: string; uzLatin: string; ru: string };
  description: { uz: string; uzLatin: string; ru: string } | null;
  lessonCount: number;
  completedCount: number;
}

export default function LessonsPage() {
  const router = useRouter();
  const { t, ts } = useLocale();
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoCategories, setVideoCategories] = useState<VideoCategoryDto[]>([]);
  const [loadingVideo, setLoadingVideo] = useState(true);

  useEffect(() => {
    apiClient.get<CategoryPerformance[]>('/progress/categories')
      .then((cats) => setCategories(cats))
      .catch(() => {})
      .finally(() => setLoading(false));

    apiClient.get<VideoCategoryDto[]>('/video-lessons/categories')
      .then((cats) => setVideoCategories(cats))
      .catch(() => {})
      .finally(() => setLoadingVideo(false));
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

      {/* Video Lessons Categories */}
      {loadingVideo ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videoCategories.length === 0 ? (
        <Card className="rounded-xl border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 mb-4">
              <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold mb-1">{ts('videoLessons.noLessons')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoCategories.map((cat) => {
            const progress = cat.lessonCount > 0 ? Math.round((cat.completedCount / cat.lessonCount) * 100) : 0;
            const isComplete = cat.lessonCount > 0 && cat.completedCount === cat.lessonCount;
            return (
              <Card
                key={cat.id}
                className="rounded-xl cursor-pointer hover:shadow-md transition-shadow border hover:border-[oklch(0.588_0.158_241)]/40"
                onClick={() => router.push(`/practice/lessons?category=${cat.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 shrink-0">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm leading-tight">{t(cat.name)}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {cat.lessonCount} {ts('videoLessons.lessonCount')}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {cat.completedCount}/{cat.lessonCount} {ts('videoLessons.watchedCount')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Categories Section -- kept from original practice page */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ts('lessons.categoriesTitle')}</h2>
        <CategorySelector onSelect={handleCategorySelect} performance={categories} />
      </div>
    </div>
  );
}
