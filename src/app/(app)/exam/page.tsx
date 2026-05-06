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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GraduationCap, Hash, Trophy, Clock, Timer, AlertTriangle, Play, Trash2, ChevronRight, CheckCircle2, XCircle, History, RefreshCw, Zap, ArrowRight, Brain, Lock, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EXAM_QUESTION_COUNT, EXAM_PASSING_SCORE, EXAM_TIME_MINUTES } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocaleStore } from '@/stores/locale-store';
import { getDateLocale } from '@/lib/date-locale';

type ExamMode = 'exam' | 'ticket' | 'marathon';
type MarafonScope = 'All' | 'Category' | 'TicketRange';

interface CategoryDto {
  id: string;
  name: { uz: string; uzLatin: string; ru: string };
  slug: string;
  questionCount?: number;
  children?: CategoryDto[];
}

function flattenCategories(nodes: CategoryDto[]): CategoryDto[] {
  const out: CategoryDto[] = [];
  const walk = (list: CategoryDto[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

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
  correctAnswerId?: string | null;
  isCorrect?: boolean | null;
  explanation?: { uz: string; uzLatin: string; ru: string } | null;
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

interface TicketSummary {
  ticketNumber: number;
  questionCount: number;
}

export default function ExamPage() {
  const router = useRouter();
  const startExam = useExamStore((s) => s.startExam);
  const { ts } = useLocale();
  const { user } = useAuth();
  const language = useLocaleStore((s) => s.language);
  const dateLocale = getDateLocale(language);
  const [loading, setLoading] = useState<ExamMode | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [practiceLoading, setPracticeLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<number>(0);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [activeExam, setActiveExam] = useState<ActiveExamDto | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [abandoning, setAbandoning] = useState(false);
  const [recentHistory, setRecentHistory] = useState<ExamHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [marafonOpen, setMarafonOpen] = useState(false);
  const [marafonScope, setMarafonScope] = useState<MarafonScope>('All');
  const [marafonCategoryId, setMarafonCategoryId] = useState<string>('');
  const [marafonTicketFrom, setMarafonTicketFrom] = useState<string>('');
  const [marafonTicketTo, setMarafonTicketTo] = useState<string>('');
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const MODE_LABELS: Record<string, string> = { exam: ts('exam.startExam'), ticket: ts('exam.startTicket'), marathon: ts('exam.startMarathon'), speedChallenge: ts('practiceMode.speedChallenge') };

  useEffect(() => {
    apiClient.get<ActiveExamDto | null>('/exams/active')
      .then((data) => setActiveExam(data))
      .catch((err) => { console.warn('[exam] Failed to check active exam:', err); })
      .finally(() => setCheckingActive(false));

    apiClient.get<{ items: ExamHistoryItem[]; meta: PaginationMeta }>('/exams/history?page=1&pageSize=5')
      .then((data) => setRecentHistory(data.items ?? []))
      .catch((err) => { console.warn('[exam] Failed to load history:', err); })
      .finally(() => setHistoryLoading(false));

    // Fetch available tickets dynamically from backend
    apiClient.get<TicketSummary[]>('/questions/tickets')
      .then((data) => {
        const sorted = (data ?? []).sort((a, b) => a.ticketNumber - b.ticketNumber);
        setTickets(sorted);
        if (sorted.length > 0 && !selectedTicket)
          setSelectedTicket(sorted[0].ticketNumber);
      })
      .catch((err) => { toast.error(ts('common.error')); console.warn('[exam] Failed to load tickets:', err); });

    apiClient.get<{ dueCount: number }>('/practice/due-count')
      .then((data) => setDueCount(typeof data === 'number' ? data : (data as any)?.dueCount ?? 0))
      .catch((err) => { console.warn('[exam] Failed to load due count:', err); })
      .finally(() => setPracticeLoading(false));
  }, []);

  const ensureCategoriesLoaded = async () => {
    if (categoriesLoaded) return;
    try {
      const data = await apiClient.get<CategoryDto[]>('/categories');
      setCategories(flattenCategories(data ?? []));
      setCategoriesLoaded(true);
    } catch {
      toast.error(ts('common.error'));
    }
  };

  const openMarafonPicker = () => {
    setMarafonScope('All');
    setMarafonCategoryId('');
    setMarafonTicketFrom('');
    setMarafonTicketTo('');
    setMarafonOpen(true);
    void ensureCategoriesLoaded();
  };

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
      startExam(data.id, data.questions, data.expiresAt, data.mode, data.totalQuestions, existingAnswers);
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
        data = await apiClient.post<ExamSessionDto>('/exams/start-marathon', { licenseCategory: 'AB', scope: 'All' });
      startExam(data.id, data.questions, data.expiresAt, mode, data.totalQuestions);
      router.push(`/exam/session/${data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(null);
    }
  };

  const handleStartMarafon = async () => {
    if (marafonScope === 'Category' && !marafonCategoryId) {
      toast.error(ts('exam.marafonCategoryRequired'));
      return;
    }
    if (marafonScope === 'TicketRange') {
      const from = parseInt(marafonTicketFrom, 10);
      const to = parseInt(marafonTicketTo, 10);
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
        toast.error(ts('exam.marafonTicketRangeInvalid'));
        return;
      }
    }
    setLoading('marathon');
    try {
      const body: Record<string, unknown> = { licenseCategory: 'AB', scope: marafonScope };
      if (marafonScope === 'Category') body.categoryId = marafonCategoryId;
      if (marafonScope === 'TicketRange') {
        body.ticketFrom = parseInt(marafonTicketFrom, 10);
        body.ticketTo = parseInt(marafonTicketTo, 10);
      }
      const data = await apiClient.post<ExamSessionDto>('/exams/start-marathon', body);
      setMarafonOpen(false);
      startExam(data.id, data.questions, data.expiresAt, 'marathon', data.totalQuestions);
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('exam.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('exam.subtitle')}</p>
      </div>

      {!checkingActive && hasActive && (
        <Card className="border border-amber-300 dark:border-amber-700 rounded-xl">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="animate-pulse h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0" />
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{ts('exam.activeExamBanner')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {MODE_LABELS[activeExam.mode] ?? activeExam.mode} &mdash; <span className="tabular-nums">{activeExam.answeredQuestions}/{activeExam.totalQuestions}</span> {ts('exam.answered')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2 rounded-xl h-11 btn-gradient-blue text-white cursor-pointer" onClick={handleResume} disabled={loading !== null}>
                <Play className="h-4 w-4" />
                {loading ? ts('common.loading') : ts('exam.resume')}
              </Button>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive rounded-xl h-11" onClick={handleAbandon} disabled={abandoning}>
                <Trash2 className="h-4 w-4" />
                {abandoning ? '...' : ts('exam.abandon')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Exam mode */}
        <Card className="card-hover relative hover:border-blue-200 dark:hover:border-blue-800 transition-colors rounded-xl flex flex-col">
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="text-[11px]">{ts('exam.realExam')}</Badge>
          </div>
          <CardContent className="pt-6 pb-4 flex flex-col items-center text-center flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 mb-3">
              <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-base font-semibold mb-1">{ts('exam.examMode')}</CardTitle>
            <p className="text-xs text-muted-foreground mb-4">{ts('exam.examDesc')}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Hash className="h-3 w-3" /><span className="tabular-nums">{EXAM_QUESTION_COUNT}</span></span>
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Timer className="h-3 w-3" /><span className="tabular-nums">{EXAM_TIME_MINUTES}</span> {ts('common.minutes')}</span>
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Trophy className="h-3 w-3" /><span className="tabular-nums">{EXAM_PASSING_SCORE}%</span></span>
            </div>
            <div className="mt-auto w-full">
              <Button className="w-full rounded-xl h-10 btn-gradient-blue text-white cursor-pointer" onClick={() => handleStart('exam')} disabled={loading !== null || hasActive}>
                {loading === 'exam' ? ts('common.loading') : ts('exam.start')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ticket mode */}
        <Card className="card-hover hover:border-violet-200 dark:hover:border-violet-800 transition-colors rounded-xl flex flex-col">
          <CardContent className="pt-6 pb-4 flex flex-col items-center text-center flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/30 mb-3">
              <Hash className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-base font-semibold mb-1">{ts('exam.ticketMode')}</CardTitle>
            <p className="text-xs text-muted-foreground mb-4">{ts('exam.ticketDesc')}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Hash className="h-3 w-3" /><span className="tabular-nums">20</span></span>
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Timer className="h-3 w-3" /><span className="tabular-nums">25</span> {ts('common.minutes')}</span>
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Clock className="h-3 w-3" /><span className="tabular-nums">{tickets.length}</span> {ts('exam.tickets')}</span>
            </div>
            <div className="mt-auto w-full space-y-2">
              <Select value={selectedTicket ? String(selectedTicket) : ''} onValueChange={(v) => setSelectedTicket(Number(v))}>
                <SelectTrigger className="w-full cursor-pointer rounded-xl text-sm">
                  <SelectValue placeholder={ts('exam.selectTicket')}>
                    {selectedTicket ? `${ts('exam.ticketPrefix')}${selectedTicket}` : ts('exam.selectTicket')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {tickets.map((t) => (
                    <SelectItem key={t.ticketNumber} value={String(t.ticketNumber)}>
                      {ts('exam.ticketPrefix')}{t.ticketNumber} ({t.questionCount} {ts('common.question')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full rounded-xl h-10 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 cursor-pointer" onClick={() => handleStart('ticket')} disabled={loading !== null || hasActive || !selectedTicket}>
                {loading === 'ticket' ? ts('common.loading') : ts('exam.startBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marathon mode */}
        <Card className="card-hover hover:border-amber-200 dark:hover:border-amber-800 transition-colors rounded-xl flex flex-col">
          <CardContent className="pt-6 pb-4 flex flex-col items-center text-center flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-3">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-base font-semibold mb-1">{ts('exam.marathonTitle')}</CardTitle>
            <p className="text-xs text-muted-foreground mb-4">{ts('exam.marathonAllQuestions')}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Hash className="h-3 w-3" />{ts('exam.questionsCount')}</span>
              <span className="flex items-center gap-1 text-[11px] rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-muted-foreground"><Clock className="h-3 w-3" />{ts('exam.progressSaved')}</span>
            </div>
            <div className="mt-auto w-full">
              <Button className="w-full rounded-xl h-10 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 cursor-pointer" onClick={openMarafonPicker} disabled={loading !== null || hasActive}>
                {loading === 'marathon' ? ts('common.loading') : ts('exam.startMarathonBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={marafonOpen} onOpenChange={setMarafonOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ts('exam.marafonScopeTitle')}</DialogTitle>
            <DialogDescription>{ts('exam.marafonScopeDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <RadioGroup value={marafonScope} onValueChange={(v) => setMarafonScope(v as MarafonScope)} className="space-y-2">
              <div className="flex items-center space-x-2 rounded-lg border p-3">
                <RadioGroupItem value="All" id="scope-all" />
                <Label htmlFor="scope-all" className="flex-1 cursor-pointer">
                  <div className="text-sm font-medium">{ts('exam.marafonScopeAll')}</div>
                  <div className="text-xs text-muted-foreground">{ts('exam.marafonScopeAllDesc')}</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 rounded-lg border p-3">
                <RadioGroupItem value="Category" id="scope-category" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="scope-category" className="cursor-pointer">
                    <div className="text-sm font-medium">{ts('exam.marafonScopeCategory')}</div>
                    <div className="text-xs text-muted-foreground">{ts('exam.marafonScopeCategoryDesc')}</div>
                  </Label>
                  {marafonScope === 'Category' && (
                    <Select value={marafonCategoryId} onValueChange={(v) => setMarafonCategoryId(v ?? '')}>
                      <SelectTrigger className="rounded-lg text-sm">
                        <SelectValue placeholder={ts('exam.marafonCategoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name[language as keyof typeof c.name] ?? c.name.uzLatin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-2 rounded-lg border p-3">
                <RadioGroupItem value="TicketRange" id="scope-ticket" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="scope-ticket" className="cursor-pointer">
                    <div className="text-sm font-medium">{ts('exam.marafonScopeTicket')}</div>
                    <div className="text-xs text-muted-foreground">{ts('exam.marafonScopeTicketDesc')}</div>
                  </Label>
                  {marafonScope === 'TicketRange' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder={ts('exam.marafonTicketFrom')}
                        value={marafonTicketFrom}
                        onChange={(e) => setMarafonTicketFrom(e.target.value)}
                        className="rounded-lg text-sm"
                      />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder={ts('exam.marafonTicketTo')}
                        value={marafonTicketTo}
                        onChange={(e) => setMarafonTicketTo(e.target.value)}
                        className="rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarafonOpen(false)} disabled={loading === 'marathon'}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleStartMarafon} disabled={loading === 'marathon' || hasActive}>
              {loading === 'marathon' ? ts('common.loading') : ts('exam.startMarathonBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Practice Modes Section */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ts('exam.practiceModesTitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button onClick={() => router.push('/practice/session?review=true')} className="text-left w-full cursor-pointer">
            <Card className="card-hover hover:border-foreground/20 transition-colors rounded-xl h-full">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/30">
                  <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ts('practice.review')}</p>
                  {practiceLoading
                    ? <Skeleton className="h-4 w-16 mt-0.5" />
                    : <p className="text-xs text-muted-foreground">{dueCount} {ts('practice.reviewWaiting')}</p>
                  }
                </div>
                {!practiceLoading && dueCount > 0 && (
                  <Badge variant="secondary" className="shrink-0 tabular-nums">{dueCount}</Badge>
                )}
              </CardContent>
            </Card>
          </button>

          <button onClick={() => router.push('/practice/session')} className="text-left w-full cursor-pointer">
            <Card className="card-hover hover:border-foreground/20 transition-colors rounded-xl h-full">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
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

          <button onClick={openMarafonPicker} className="text-left w-full cursor-pointer">
            <Card className="card-hover hover:border-foreground/20 transition-colors rounded-xl h-full">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ts('practice.marathon')}</p>
                  <p className="text-xs text-muted-foreground">{ts('practice.marathonDesc')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </button>
        </div>
      </div>

      {/* Additional Premium Modes */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ts('practiceMode.additionalModes')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={() => {
              if (!user?.hasActiveSubscription) { toast.error(ts('practiceMode.premiumRequired')); return; }
              router.push('/practice/session?mode=review');
            }}
            className="text-left w-full cursor-pointer"
          >
            <Card className="card-hover hover:border-foreground/20 transition-colors relative overflow-hidden rounded-xl h-full">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/30 relative">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  {!user?.hasActiveSubscription && <Lock className="h-3 w-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{ts('practiceMode.review')}</p>
                    <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Crown className="h-3 w-3 mr-0.5" />{ts('practiceMode.premiumBadge')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ts('practiceMode.reviewDesc')}</p>
                </div>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => {
              if (!user?.hasActiveSubscription) { toast.error(ts('practiceMode.premiumRequired')); return; }
              router.push('/practice/session?mode=hard');
            }}
            className="text-left w-full cursor-pointer"
          >
            <Card className="card-hover hover:border-foreground/20 transition-colors relative overflow-hidden rounded-xl h-full">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30 relative">
                  <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
                  {!user?.hasActiveSubscription && <Lock className="h-3 w-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{ts('practiceMode.hardMode')}</p>
                    <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Crown className="h-3 w-3 mr-0.5" />{ts('practiceMode.premiumBadge')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ts('practiceMode.hardModeDesc')}</p>
                </div>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => {
              if (!user?.hasActiveSubscription) { toast.error(ts('practiceMode.premiumRequired')); return; }
              router.push('/practice/session?mode=speed');
            }}
            className="text-left w-full cursor-pointer"
          >
            <Card className="card-hover hover:border-foreground/20 transition-colors relative overflow-hidden rounded-xl h-full">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 relative">
                  <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  {!user?.hasActiveSubscription && <Lock className="h-3 w-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{ts('practiceMode.speedChallenge')}</p>
                    <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Crown className="h-3 w-3 mr-0.5" />{ts('practiceMode.premiumBadge')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ts('practiceMode.speedChallengeDesc')}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">{ts('practiceMode.timePerQuestion')}</Badge>
              </CardContent>
            </Card>
          </button>
        </div>
      </div>

      {/* Recent History Section */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">{ts('exam.recentHistory')}</CardTitle>
          </div>
          <Link href="/exam/history" className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
            {ts('exam.viewAll')}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : recentHistory.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-2">
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
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl shrink-0',
                      item.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    )}>
                      {item.passed
                        ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold tabular-nums">{item.correctAnswers}/{item.totalQuestions} ({item.score}%)</p>
                        <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium', MODE_BADGE_STYLES[item.mode] ?? MODE_BADGE_STYLES.exam)}>
                          {ts(`history.mode.${item.mode}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(item.completedAt), { addSuffix: true, locale: dateLocale })}</span>
                        {item.timeTakenSeconds > 0 && (
                          <>
                            <span>&middot;</span>
                            <span className="tabular-nums">{formatTime(item.timeTakenSeconds)}</span>
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
