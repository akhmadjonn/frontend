'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useExamStore } from '@/stores/exam-store';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Hash, Trophy, Clock, Timer, AlertTriangle, Play, Trash2, ChevronRight, CheckCircle2, XCircle, History } from 'lucide-react';
import { EXAM_QUESTION_COUNT, EXAM_PASSING_SCORE, EXAM_TIME_MINUTES } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type ExamMode = 'exam' | 'ticket' | 'marathon';

interface AnswerOptionDto {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
}

interface ExamQuestionDto {
  id: string;
  questionId: string;
  order: number;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  answerOptions: AnswerOptionDto[];
  selectedAnswerId: string | null;
}

interface ExamSessionDto {
  id: string;
  status: string;
  totalQuestions: number;
  passingScore: number;
  timeLimitMinutes: number;
  expiresAt: string | null;
  mode: ExamMode;
  ticketNumber: number | null;
  questions: ExamQuestionDto[];
}

interface ActiveExamDto {
  id: string;
  mode: string;
  totalQuestions: number;
  answeredQuestions: number;
  expiresAt: string | null;
  createdAt: string;
}

interface ExamHistoryItem {
  examId: string;
  mode: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
  timeTakenSeconds: number;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const MODE_BADGE_STYLES: Record<string, string> = {
  exam: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ticket: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  marathon: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  speedChallenge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const TICKET_NUMBERS = Array.from({ length: 57 }, (_, i) => i + 1);

export default function ExamPage() {
  const router = useRouter();
  const startExam = useExamStore((s) => s.startExam);
  const { ts } = useLocale();
  const [loading, setLoading] = useState<ExamMode | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number>(1);
  const [activeExam, setActiveExam] = useState<ActiveExamDto | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [abandoning, setAbandoning] = useState(false);
  const [recentHistory, setRecentHistory] = useState<ExamHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const MODE_LABELS: Record<string, string> = { exam: ts('exam.startExam'), ticket: ts('exam.startTicket'), marathon: ts('exam.startMarathon'), speedChallenge: ts('practiceMode.speedChallenge') };

  useEffect(() => {
    apiClient.get<ActiveExamDto | null>('/exams/active')
      .then((data) => setActiveExam(data))
      .catch(() => {})
      .finally(() => setCheckingActive(false));

    apiClient.get<{ items: ExamHistoryItem[]; meta: PaginationMeta }>('/exams/history?page=1&pageSize=5')
      .then((data) => setRecentHistory(data.items ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleResume = async () => {
    if (!activeExam) return;
    if (activeExam.mode === 'speedChallenge') {
      router.push('/practice/session?mode=speed');
      return;
    }
    setLoading(activeExam.mode as ExamMode);
    try {
      const data = await apiClient.get<ExamSessionDto>(`/exams/${activeExam.id}`);
      const existingAnswers = new Map<string, string>();
      for (const q of data.questions)
        if (q.selectedAnswerId) existingAnswers.set(q.id, q.selectedAnswerId);
      startExam(data.id, data.questions, data.expiresAt, data.mode, existingAnswers);
      router.push(`/exam/session/${data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(null);
    }
  };

  const handleAbandon = async () => {
    if (!activeExam) return;
    setAbandoning(true);
    try {
      await apiClient.post(`/exams/${activeExam.id}/abandon`, {});
      setActiveExam(null);
      toast.success(ts('exam.abandoned'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setAbandoning(false);
    }
  };

  const handleStart = async (mode: ExamMode) => {
    setLoading(mode);
    try {
      let data: ExamSessionDto;
      if (mode === 'exam')
        data = await apiClient.post<ExamSessionDto>('/exams/start', { licenseCategory: 'AB' });
      else if (mode === 'ticket')
        data = await apiClient.post<ExamSessionDto>('/exams/start-ticket', { ticketNumber: selectedTicket });
      else
        data = await apiClient.post<ExamSessionDto>('/exams/start-marathon', {});
      startExam(data.id, data.questions, data.expiresAt, mode);
      router.push(`/exam/session/${data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(null);
    }
  };

  const hasActive = activeExam !== null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('exam.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('exam.subtitle')}</p>
      </div>

      {!checkingActive && hasActive && (
        <Card className="border border-amber-300 dark:border-amber-700">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">{ts('exam.activeExamBanner')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {MODE_LABELS[activeExam.mode] ?? activeExam.mode} &mdash; {activeExam.answeredQuestions}/{activeExam.totalQuestions} {ts('exam.answered')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" onClick={handleResume} disabled={loading !== null}>
                <Play className="h-4 w-4" />
                {loading ? ts('common.loading') : ts('exam.resume')}
              </Button>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={handleAbandon} disabled={abandoning}>
                <Trash2 className="h-4 w-4" />
                {abandoning ? '...' : ts('exam.abandon')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {/* Exam mode */}
        <Card className="relative hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="text-[11px]">{ts('exam.realExam')}</Badge>
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{ts('exam.examMode')}</CardTitle>
                <p className="text-xs text-muted-foreground">{ts('exam.examDesc')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Hash className="h-3.5 w-3.5" />{EXAM_QUESTION_COUNT} {ts('common.question')}</span>
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Timer className="h-3.5 w-3.5" />{EXAM_TIME_MINUTES} {ts('common.minutes')}</span>
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Trophy className="h-3.5 w-3.5" />{ts('exam.passingRate')} {EXAM_PASSING_SCORE}%</span>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer" onClick={() => handleStart('exam')} disabled={loading !== null || hasActive}>
              {loading === 'exam' ? ts('common.loading') : ts('exam.start')}
            </Button>
          </CardContent>
        </Card>

        {/* Ticket mode */}
        <Card className="hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                <Hash className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{ts('exam.ticketMode')}</CardTitle>
                <p className="text-xs text-muted-foreground">{ts('exam.ticketDesc')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Hash className="h-3.5 w-3.5" />20 {ts('common.question')}</span>
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Timer className="h-3.5 w-3.5" />25 {ts('common.minutes')}</span>
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />57 {ts('exam.tickets')}</span>
            </div>
            <div className="flex gap-2">
              <Select value={String(selectedTicket)} onValueChange={(v) => setSelectedTicket(Number(v))}>
                <SelectTrigger className="flex-1 cursor-pointer">
                  <SelectValue placeholder={ts('exam.selectTicket')} />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {TICKET_NUMBERS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{ts('exam.ticketPrefix')}{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="shrink-0 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 cursor-pointer" onClick={() => handleStart('ticket')} disabled={loading !== null || hasActive}>
                {loading === 'ticket' ? '...' : ts('exam.startBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marathon mode */}
        <Card className="hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{ts('exam.marathonTitle')}</CardTitle>
                <p className="text-xs text-muted-foreground">{ts('exam.marathonAllQuestions')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Hash className="h-3.5 w-3.5" />{ts('exam.questionsCount')}</span>
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{ts('exam.progressSaved')}</span>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 cursor-pointer" onClick={() => handleStart('marathon')} disabled={loading !== null || hasActive}>
              {loading === 'marathon' ? ts('common.loading') : ts('exam.startMarathonBtn')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent History Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{ts('exam.recentHistory')}</CardTitle>
          </div>
          <Link href="/exam/history" className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
            {ts('exam.viewAll')}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : recentHistory.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{ts('history.noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentHistory.map((item) => (
                <Link
                  key={item.examId}
                  href={`/exam/result/${item.examId}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                      item.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    )}>
                      {item.passed
                        ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{item.correctAnswers}/{item.totalQuestions} ({item.score}%)</p>
                        <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium', MODE_BADGE_STYLES[item.mode] ?? MODE_BADGE_STYLES.exam)}>
                          {ts(`history.mode.${item.mode}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}</span>
                        {item.timeTakenSeconds > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{formatTime(item.timeTakenSeconds)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
