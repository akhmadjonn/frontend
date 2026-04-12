'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  PlayCircle, Lock, Download, FileText, Clock, CheckCircle2, BookOpen,
} from 'lucide-react';
import { PdfViewer } from '@/components/lessons/pdf-viewer';

interface LessonAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
}

interface VideoLessonDetailDto {
  id: string;
  videoCategoryId: string;
  categoryName: { uz: string; uzLatin: string; ru: string } | null;
  title: { uz: string; uzLatin: string; ru: string };
  description: { uz: string; uzLatin: string; ru: string } | null;
  sourceType: string; // 'upload' | 'youTube' | 'externalLink' | 'presentation'
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  isFree: boolean;
  isDownloadable: boolean;
  isCompleted: boolean;
  watchedSeconds: number;
  attachments: LessonAttachmentDto[];
  previousLessonId: string | null;
  nextLessonId: string | null;
  linkedCategoryId: string | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractYouTubeId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;
  const { t, ts } = useLocale();
  const { user } = useAuth();
  const hasSubscription = user?.hasActiveSubscription ?? false;

  const [lesson, setLesson] = useState<VideoLessonDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [pdfCompleted, setPdfCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    setError(false);
    apiClient.get<VideoLessonDetailDto>(`/video-lessons/${lessonId}`)
      .then((data) => setLesson(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [lessonId]);

  // Progress tracking for HTML5 video
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) return;
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const watchedSeconds = Math.floor(videoRef.current.currentTime);
        apiClient.post(`/video-lessons/${lessonId}/progress`, { watchedSeconds }).catch(() => {});
      }
    }, 10000);
  }, [lessonId]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => stopProgressTracking();
  }, [stopProgressTracking]);

  // YouTube postMessage progress tracking
  useEffect(() => {
    if (!lesson || lesson.sourceType !== 'youTube') return;

    let ytInterval: ReturnType<typeof setInterval> | null = null;
    let currentTime = 0;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined)
          currentTime = Math.floor(data.info.currentTime);
      } catch {
        // ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);

    ytInterval = setInterval(() => {
      if (currentTime > 0)
        apiClient.post(`/video-lessons/${lessonId}/progress`, { watchedSeconds: currentTime }).catch(() => {});
    }, 10000);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (ytInterval) clearInterval(ytInterval);
    };
  }, [lesson, lessonId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {ts('videoLessons.backToLessons')}
        </Button>
        <Card className="rounded-xl">
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium">{ts('common.error')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPremiumLocked = !lesson.isFree && !hasSubscription;
  const youtubeId = lesson.sourceType === 'youTube' && lesson.videoUrl ? extractYouTubeId(lesson.videoUrl) : null;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/practice/lessons?category=${lesson.videoCategoryId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">{t(lesson.title)}</h1>
          {lesson.categoryName && (
            <p className="text-xs text-muted-foreground">{t(lesson.categoryName)}</p>
          )}
        </div>
      </div>

      {/* Premium wall */}
      {isPremiumLocked ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-lg font-semibold mb-2">{ts('videoLessons.premiumRequired')}</p>
            <Button
              className="mt-4 rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white"
              onClick={() => router.push('/subscription')}
            >
              {ts('videoLessons.subscribe')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Player */}
          {lesson.sourceType === 'presentation' && lesson.videoUrl ? (
            <>
              <PdfViewer
                url={lesson.videoUrl}
                onPageChange={(currentPage, totalPages) => {
                  apiClient.post(`/video-lessons/${lessonId}/progress`, { watchedSeconds: currentPage }).catch(() => {});
                }}
                onComplete={() => setPdfCompleted(true)}
                className="w-full min-h-[400px]"
              />

              {pdfCompleted && (
                <Card className="rounded-xl border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="flex flex-col items-center py-6 text-center gap-3">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                      {ts('videoLessons.lessonCompleted')}
                    </p>
                    {lesson.linkedCategoryId ? (
                      <Button
                        className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white mt-1"
                        onClick={() => router.push(`/practice/session?categoryId=${lesson.linkedCategoryId}`)}
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        {ts('videoLessons.startPractice')}
                      </Button>
                    ) : lesson.nextLessonId ? (
                      <Button
                        variant="outline"
                        className="rounded-xl mt-1"
                        onClick={() => router.push(`/practice/lessons/${lesson.nextLessonId}`)}
                      >
                        {ts('videoLessons.nextLesson')}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              {lesson.sourceType === 'youTube' && youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0`}
                  title={t(lesson.title)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : lesson.videoUrl ? (
                <video
                  ref={videoRef}
                  src={lesson.videoUrl}
                  controls
                  className="h-full w-full"
                  poster={lesson.thumbnailUrl ?? undefined}
                  onPlay={startProgressTracking}
                  onPause={stopProgressTracking}
                  onEnded={() => {
                    stopProgressTracking();
                    if (videoRef.current) {
                      const watchedSeconds = Math.floor(videoRef.current.currentTime);
                      apiClient.post(`/video-lessons/${lessonId}/progress`, { watchedSeconds }).catch(() => {});
                    }
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-white/50" />
                </div>
              )}
            </div>
          )}

          {/* Lesson Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDuration(lesson.durationSeconds)}
              </div>
              {lesson.isFree ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 text-xs">
                  {ts('videoLessons.free')}
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 text-xs">
                  {ts('videoLessons.premium')}
                </Badge>
              )}
              {lesson.isCompleted && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 text-xs">
                  {ts('videoLessons.completed')}
                </Badge>
              )}
            </div>
            {lesson.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{t(lesson.description)}</p>
            )}
          </div>

          {/* Next/Previous Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!lesson.previousLessonId}
              onClick={() => lesson.previousLessonId && router.push(`/practice/lessons/${lesson.previousLessonId}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {ts('videoLessons.prevLesson')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!lesson.nextLessonId}
              onClick={() => lesson.nextLessonId && router.push(`/practice/lessons/${lesson.nextLessonId}`)}
            >
              {ts('videoLessons.nextLesson')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Download Video */}
          {lesson.isDownloadable && lesson.videoUrl && lesson.sourceType !== 'youTube' && (
            <a
              href={lesson.videoUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <Download className="h-4 w-4" />
              {lesson.sourceType === 'presentation' ? ts('videoLessons.downloadPdf') : ts('videoLessons.downloadVideo')}
            </a>
          )}

          {/* Attachments */}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3">{ts('admin.videoLessons.attachments')}</h2>
              <div className="space-y-2">
                {lesson.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSizeBytes)}</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
