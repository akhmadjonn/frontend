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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Hash, Trophy, Clock, Timer, AlertTriangle, Play, Trash2 } from 'lucide-react';
import { EXAM_QUESTION_COUNT, EXAM_PASSING_SCORE, EXAM_TIME_MINUTES } from '@/lib/constants';
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

  const MODE_LABELS: Record<string, string> = { exam: ts('exam.startExam'), ticket: ts('exam.startTicket'), marathon: ts('exam.startMarathon'), speedChallenge: ts('practiceMode.speedChallenge') };

  useEffect(() => {
    apiClient.get<ActiveExamDto | null>('/exams/active')
      .then((data) => setActiveExam(data))
      .catch(() => {})
      .finally(() => setCheckingActive(false));
  }, []);

  const handleResume = async () => {
    if (!activeExam) return;
    // Speed challenge has its own UI — redirect there
    if (activeExam.mode === 'speedChallenge') {
      router.push('/practice/session?mode=speed');
      return;
    }
    setLoading(activeExam.mode as ExamMode);
    try {
      const data = await apiClient.get<ExamSessionDto>(`/exams/${activeExam.id}`);
      const existingAnswers = new Map<string, string>();
      for (const q of data.questions) {
        if (q.selectedAnswerId) existingAnswers.set(q.id, q.selectedAnswerId);
      }
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
              <Button className="flex-1 gap-2" onClick={handleResume} disabled={loading !== null}>
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
        <Card className="relative hover:border-foreground/20 transition-colors">
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
            <Button className="w-full" onClick={() => handleStart('exam')} disabled={loading !== null || hasActive}>
              {loading === 'exam' ? ts('common.loading') : ts('exam.start')}
            </Button>
          </CardContent>
        </Card>

        {/* Ticket mode */}
        <Card className="hover:border-foreground/20 transition-colors">
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
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={ts('exam.selectTicket')} />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {TICKET_NUMBERS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{ts('exam.ticketPrefix')}{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleStart('ticket')} disabled={loading !== null || hasActive} className="shrink-0">
                {loading === 'ticket' ? '...' : ts('exam.startBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marathon mode */}
        <Card className="hover:border-foreground/20 transition-colors">
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
            <Button variant="outline" className="w-full" onClick={() => handleStart('marathon')} disabled={loading !== null || hasActive}>
              {loading === 'marathon' ? ts('common.loading') : ts('exam.startMarathonBtn')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg bg-muted p-4 text-center">
        <Link href="/progress" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {ts('exam.viewHistory')}
        </Link>
      </div>
    </div>
  );
}
