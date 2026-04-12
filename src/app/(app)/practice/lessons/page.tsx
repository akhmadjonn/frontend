'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, PlayCircle, CheckCircle2, Lock, Clock, FileText } from 'lucide-react';

interface VideoLessonDto {
  id: string;
  title: { uz: string; uzLatin: string; ru: string };
  description: { uz: string; uzLatin: string; ru: string } | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  isFree: boolean;
  isCompleted: boolean;
  watchedSeconds: number;
  sortOrder: number;
  sourceType?: string;
  linkedCategoryId?: string | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function LessonListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');
  const { t, ts } = useLocale();
  const { user } = useAuth();
  const hasSubscription = user?.hasActiveSubscription ?? false;

  const [lessons, setLessons] = useState<VideoLessonDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    apiClient.get<VideoLessonDto[]>(`/video-lessons/categories/${categoryId}/lessons`)
      .then((data) => setLessons(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (!categoryId) {
    router.replace('/practice');
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/practice')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{ts('videoLessons.allLessons')}</h1>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-16 w-28 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">{ts('videoLessons.noLessons')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const isPremiumLocked = !lesson.isFree && !hasSubscription;
            const progressPercent = lesson.durationSeconds > 0
              ? Math.min(100, Math.round((lesson.watchedSeconds / lesson.durationSeconds) * 100))
              : 0;

            return (
              <Card
                key={lesson.id}
                className={`rounded-xl cursor-pointer hover:shadow-md transition-shadow border hover:border-[oklch(0.588_0.158_241)]/40 ${isPremiumLocked ? 'opacity-75' : ''}`}
                onClick={() => router.push(`/practice/lessons/${lesson.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative h-16 w-28 rounded-lg bg-muted shrink-0 overflow-hidden">
                    {lesson.thumbnailUrl ? (
                      <img
                        src={lesson.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {lesson.sourceType === 'presentation' ? (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <PlayCircle className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {isPremiumLocked && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                    )}
                    {lesson.isCompleted && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-tight truncate">{t(lesson.title)}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(lesson.durationSeconds)}
                      </div>
                      {lesson.isFree ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 text-[10px] px-1.5 py-0">
                          {ts('videoLessons.free')}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 text-[10px] px-1.5 py-0">
                          {ts('videoLessons.premium')}
                        </Badge>
                      )}
                      {lesson.sourceType === 'presentation' ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">PDF</Badge>
                      ) : lesson.sourceType === 'youTube' ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 border-red-200">YouTube</Badge>
                      ) : null}
                    </div>
                    {/* Progress bar for partially watched */}
                    {!lesson.isCompleted && lesson.watchedSeconds > 0 && (
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[oklch(0.588_0.158_241)] rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
