'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePracticeStore } from '@/stores/practice-store';
import PracticeQuestion from '@/components/practice/practice-question';
import ExplanationPanel from '@/components/practice/explanation-panel';
import SpeedTimer from '@/components/practice/speed-timer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, XCircle, Trophy, Zap, Clock } from 'lucide-react';
import { PRACTICE_BATCH_SIZE } from '@/lib/constants';
import { useLocale } from '@/hooks/use-locale';
import { toast } from 'sonner';

interface PracticeQuestionData {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  categoryName: { uz: string; uzLatin: string; ru: string };
  difficulty: number;
  answerOptions: Array<{ id: string; text: { uz: string; uzLatin: string; ru: string }; imageUrl: string | null }>;
  leitnerBox: number;
}

interface PracticeSession {
  questions: PracticeQuestionData[];
  dueReviewCount: number;
}

interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswerId: string;
  explanation: { uz: string; uzLatin: string; ru: string } | null;
  newLeitnerBox: number;
  nextReviewDate: string | null;
}

// Speed challenge types (exam-style session from backend)
interface SpeedSessionQuestion {
  id: string; // sessionQuestionId
  questionId: string;
  order: number;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  answerOptions: Array<{ id: string; text: { uz: string; uzLatin: string; ru: string }; imageUrl: string | null }>;
  selectedAnswerId?: string | null;
}

interface SpeedSessionResponse {
  id: string;
  status: string;
  totalQuestions: number;
  passingScore: number;
  timeLimitMinutes: number;
  expiresAt: string | null;
  mode: string;
  ticketNumber: number | null;
  questions: SpeedSessionQuestion[];
  timeLimitPerQuestionSeconds: number | null;
}

interface SpeedAnswer {
  sessionQuestionId: string;
  selectedAnswerId: string | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
}

export default function PracticeSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const mode = searchParams.get('mode');
  const isSpeedMode = mode === 'speed';
  const { ts } = useLocale();

  // Regular practice state (from store)
  const { questions, currentIndex, answers, batchComplete, setQuestions, addAnswer, nextQuestion, completeBatch, reset } = usePracticeStore();

  // Speed challenge state
  const [speedSession, setSpeedSession] = useState<SpeedSessionResponse | null>(null);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [speedAnswers, setSpeedAnswers] = useState<SpeedAnswer[]>([]);
  const [speedComplete, setSpeedComplete] = useState(false);
  const [speedSelectedId, setSpeedSelectedId] = useState<string | null>(null);
  const [speedInitialSeconds, setSpeedInitialSeconds] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const speedSubmittingRef = useRef(false);
  const speedStartedRef = useRef(false);

  const SPEED_STORAGE_KEY = 'avtolider:speed-challenge';

  // --- SPEED CHALLENGE ---
  const startSpeedChallenge = useCallback(async () => {
    if (speedStartedRef.current) return;
    speedStartedRef.current = true;
    setLoading(true);
    try {
      // Check for existing active speed challenge session (page refresh / Strict Mode)
      try {
        const active = await apiClient.get<{ id: string; mode: string } | null>('/exams/active');
        if (active?.id && active.mode === 'speedChallenge') {
          // Resume existing session
          const session = await apiClient.get<SpeedSessionResponse>(`/exams/${active.id}`);
          // Restore progress: prefer sessionStorage index, fallback to backend answered count
          const saved = sessionStorage.getItem(SPEED_STORAGE_KEY);
          const savedState = saved ? JSON.parse(saved) : null;
          const isMatchingSession = savedState?.sessionId === active.id;
          const resumeIndex = isMatchingSession
            ? savedState.index
            : session.questions.filter(q => q.selectedAnswerId).length;

          // Calculate remaining time for current question (prevent timer reset cheat)
          const perQuestion = session.timeLimitPerQuestionSeconds ?? 15;
          let remainingSeconds: number | null = null;
          if (isMatchingSession && savedState.questionStartedAt) {
            const elapsed = Math.floor((Date.now() - savedState.questionStartedAt) / 1000);
            remainingSeconds = Math.max(0, perQuestion - elapsed);
          }

          setSpeedSession(session);
          setSpeedIndex(resumeIndex);
          setSpeedInitialSeconds(remainingSeconds);
          setSpeedAnswers([]);
          setSpeedComplete(false);
          setSpeedSelectedId(null);
          startTimeRef.current = Date.now();
          setLoading(false);
          return;
        }
        // Abandon non-speed active sessions
        if (active?.id) {
          await apiClient.post(`/exams/${active.id}/abandon`, {});
        }
      } catch {
        // No active session — proceed to create new
      }

      const session = await apiClient.post<SpeedSessionResponse>('/exams/start-speed-challenge', {
        licenseCategory: 0, // AB (default)
      });
      sessionStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify({ sessionId: session.id, index: 0, questionStartedAt: Date.now() }));
      setSpeedSession(session);
      setSpeedIndex(0);
      setSpeedAnswers([]);
      setSpeedComplete(false);
      setSpeedSelectedId(null);
      startTimeRef.current = Date.now();
    } catch (err: unknown) {
      speedStartedRef.current = false;
      const msg = err instanceof Error ? err.message : 'Failed to start speed challenge';
      // If a session was created by a concurrent call (Strict Mode), try to resume it
      if (msg.includes('active exam session') || msg.includes('ACTIVE_SESSION')) {
        try {
          const active = await apiClient.get<{ id: string; mode: string } | null>('/exams/active');
          if (active?.id && active.mode === 'speedChallenge') {
            const session = await apiClient.get<SpeedSessionResponse>(`/exams/${active.id}`);
            const saved = sessionStorage.getItem(SPEED_STORAGE_KEY);
            const savedState = saved ? JSON.parse(saved) : null;
            const isMatchingSession = savedState?.sessionId === active.id;
            const resumeIndex = isMatchingSession
              ? savedState.index
              : session.questions.filter(q => q.selectedAnswerId).length;
            const perQuestion = session.timeLimitPerQuestionSeconds ?? 15;
            let remainingSeconds: number | null = null;
            if (isMatchingSession && savedState.questionStartedAt) {
              const elapsed = Math.floor((Date.now() - savedState.questionStartedAt) / 1000);
              remainingSeconds = Math.max(0, perQuestion - elapsed);
            }
            sessionStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify({ sessionId: active.id, index: resumeIndex, questionStartedAt: savedState?.questionStartedAt ?? Date.now() }));
            setSpeedSession(session);
            setSpeedIndex(resumeIndex);
            setSpeedInitialSeconds(remainingSeconds);
            setSpeedAnswers([]);
            setSpeedComplete(false);
            setSpeedSelectedId(null);
            startTimeRef.current = Date.now();
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to error
        }
      }
      toast.error(msg);
      router.push('/practice');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const submitSpeedAnswer = useCallback(async (answerId: string | null) => {
    if (!speedSession || speedSubmittingRef.current) return;
    speedSubmittingRef.current = true;

    const question = speedSession.questions[speedIndex];
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Record locally
    const answer: SpeedAnswer = {
      sessionQuestionId: question.id,
      selectedAnswerId: answerId,
      isCorrect: null, // we don't know yet in exam mode
      timeSpentSeconds: timeSpent,
    };

    setSpeedAnswers(prev => [...prev, answer]);
    setSpeedSelectedId(answerId);

    // Submit to backend (fire-and-forget style, like exam)
    if (answerId) {
      try {
        await apiClient.post(`/exams/${speedSession.id}/answer`, {
          sessionQuestionId: question.id,
          selectedAnswerId: answerId,
          timeSpentSeconds: timeSpent,
        });
      } catch {
        // Silent fail — exam pattern
      }
    }

    // Brief delay to show selection, then advance
    setTimeout(() => {
      if (speedIndex + 1 >= speedSession.questions.length) {
        // Complete the session
        apiClient.post(`/exams/${speedSession.id}/complete`, {}).catch(() => {});
        sessionStorage.removeItem(SPEED_STORAGE_KEY);
        setSpeedComplete(true);
      } else {
        const nextIndex = speedIndex + 1;
        sessionStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify({ sessionId: speedSession.id, index: nextIndex, questionStartedAt: Date.now() }));
        setSpeedIndex(nextIndex);
        setSpeedSelectedId(null);
        setSpeedInitialSeconds(null);
        startTimeRef.current = Date.now();
      }
      speedSubmittingRef.current = false;
    }, answerId ? 300 : 0); // instant advance on timeout (no selection), brief flash on user selection
  }, [speedSession, speedIndex]);

  const handleSpeedTimerExpire = useCallback(() => {
    // Auto-submit current selection or skip
    submitSpeedAnswer(speedSelectedId);
  }, [submitSpeedAnswer, speedSelectedId]);

  const handleSpeedAnswer = useCallback((answerId: string) => {
    if (speedSubmittingRef.current || speedSelectedId) return;
    submitSpeedAnswer(answerId);
  }, [submitSpeedAnswer, speedSelectedId]);

  // --- REGULAR PRACTICE ---
  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set('categoryId', categoryId);
      params.set('batchSize', String(PRACTICE_BATCH_SIZE));
      const session = await apiClient.get<PracticeSession>(`/practice/session?${params}`);
      if (session.questions.length === 0) {
        completeBatch();
      } else {
        setQuestions(session.questions);
      }
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, [categoryId, setQuestions, completeBatch]);

  useEffect(() => {
    if (isSpeedMode) {
      startSpeedChallenge();
    } else {
      reset();
      fetchSession();
      return () => reset();
    }
  }, [isSpeedMode, startSpeedChallenge, fetchSession, reset]);

  const handleAnswer = useCallback(async (answerId: string) => {
    if (submitting || selectedAnswerId) return;
    setSubmitting(true);
    setSelectedAnswerId(answerId);

    const question = questions[currentIndex];
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const result = await apiClient.post<AnswerFeedback>('/practice/answer', {
        questionId: question.id,
        selectedAnswerId: answerId,
        timeSpentSeconds: timeSpent,
      });
      setFeedback(result);
      addAnswer({
        questionId: question.id,
        selectedAnswerId: answerId,
        isCorrect: result.isCorrect,
        correctAnswerId: result.correctAnswerId,
      });
    } catch {
      setFeedback(null);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, selectedAnswerId, questions, currentIndex, addAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      completeBatch();
    } else {
      nextQuestion();
      setFeedback(null);
      setSelectedAnswerId(null);
      startTimeRef.current = Date.now();
    }
  }, [currentIndex, questions.length, completeBatch, nextQuestion]);

  useEffect(() => {
    if (isSpeedMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedAnswerId && !submitting) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeedMode, selectedAnswerId, submitting, handleNext]);

  const handleNewBatch = useCallback(() => {
    if (isSpeedMode) {
      sessionStorage.removeItem(SPEED_STORAGE_KEY);
      setSpeedSession(null);
      setSpeedComplete(false);
      setSpeedAnswers([]);
      setSpeedIndex(0);
      setSpeedSelectedId(null);
      speedStartedRef.current = false;
      startSpeedChallenge();
    } else {
      reset();
      setFeedback(null);
      setSelectedAnswerId(null);
      startTimeRef.current = Date.now();
      fetchSession();
    }
  }, [isSpeedMode, reset, fetchSession, startSpeedChallenge]);

  // --- LOADING ---
  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );

  // --- SPEED CHALLENGE COMPLETE ---
  if (isSpeedMode && speedComplete && speedSession) {
    const total = speedSession.questions.length;
    const answered = speedAnswers.filter(a => a.selectedAnswerId).length;
    const skipped = total - answered;
    const avgTime = speedAnswers.length > 0
      ? Math.round(speedAnswers.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / speedAnswers.length)
      : 0;
    const perQuestion = speedSession.timeLimitPerQuestionSeconds ?? 15;

    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Zap className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{ts('practice.speedComplete')}</h1>
          <p className="text-muted-foreground">
            {answered}/{total} {ts('practice.questionsAnswered')}
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {ts('practice.answered')}
              </span>
              <span className="text-lg font-bold">{answered}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-600" />
                {ts('practice.skipped')}
              </span>
              <span className="text-lg font-bold">{skipped}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" />
                {ts('practice.avgTime')}
              </span>
              <span className="text-lg font-bold">{avgTime}s / {perQuestion}s</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {ts('practice.speedResultHint')}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => router.push('/practice')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {ts('common.back')}
          </Button>
          <Button onClick={handleNewBatch} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <RotateCcw className="h-4 w-4" /> {ts('practice.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  // --- REGULAR PRACTICE COMPLETE ---
  if (!isSpeedMode && batchComplete) {
    const correct = answers.filter((a) => a.isCorrect).length;
    const total = answers.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${accuracy >= 80 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              <Trophy className={`h-8 w-8 ${accuracy >= 80 ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{ts('practice.sessionComplete')}</h1>
          <p className="text-muted-foreground">
            {total} {ts('practice.outOf')} {correct} {ts('practice.wereCorrect')}
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{ts('common.accuracy')}</span>
              <span className="text-xl font-bold tracking-tight">{accuracy}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${accuracy >= 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${accuracy}%` }} />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{correct} {ts('common.correct').toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>{total - correct} {ts('common.incorrect').toLowerCase()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => router.push('/practice')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {ts('common.back')}
          </Button>
          <Button onClick={handleNewBatch} className="gap-2">
            <RotateCcw className="h-4 w-4" /> {ts('practice.practiceMore')}
          </Button>
        </div>
      </div>
    );
  }

  // --- SPEED CHALLENGE ACTIVE ---
  if (isSpeedMode && speedSession) {
    const sq = speedSession.questions[speedIndex];
    if (!sq) return null;

    const perQuestion = speedSession.timeLimitPerQuestionSeconds ?? 15;

    // Adapt speed question to PracticeQuestionData shape
    const practiceQuestion: PracticeQuestionData = {
      id: sq.questionId,
      text: sq.text,
      imageUrl: sq.imageUrl,
      categoryName: { uz: '', uzLatin: '', ru: '' },
      difficulty: 0,
      answerOptions: sq.answerOptions,
      leitnerBox: 0,
    };

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header with progress + timer */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/practice')} className="shrink-0 -ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${((speedIndex + 1) / speedSession.questions.length) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
              {speedIndex + 1}/{speedSession.questions.length}
            </span>
          </div>

          <SpeedTimer
            seconds={speedInitialSeconds ?? perQuestion}
            questionKey={sq.id}
            onExpire={handleSpeedTimerExpire}
          />
        </div>

        {/* Question */}
        <PracticeQuestion
          question={practiceQuestion}
          questionNumber={speedIndex + 1}
          totalQuestions={speedSession.questions.length}
          onAnswer={handleSpeedAnswer}
          disabled={speedSubmittingRef.current || speedSelectedId !== null}
          selectedAnswerId={speedSelectedId ?? undefined}
        />
      </div>
    );
  }

  // --- REGULAR PRACTICE EMPTY ---
  if (!isSpeedMode && questions.length === 0)
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">{ts('practice.noQuestions')}</p>
        <Button variant="outline" onClick={() => router.push('/practice')}>{ts('common.back')}</Button>
      </div>
    );

  // --- REGULAR PRACTICE ACTIVE ---
  if (!isSpeedMode) {
    const current = questions[currentIndex];

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/practice')} className="shrink-0 -ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        {/* Question */}
        <PracticeQuestion
          question={current}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          disabled={submitting}
          selectedAnswerId={selectedAnswerId ?? undefined}
          correctAnswerId={feedback?.correctAnswerId}
        />

        {/* Explanation */}
        {feedback && (
          <ExplanationPanel
            isCorrect={feedback.isCorrect}
            explanation={feedback.explanation ?? null}
            newLeitnerBox={feedback.newLeitnerBox}
            nextReviewDate={feedback.nextReviewDate ?? null}
          />
        )}

        {/* Next button */}
        {selectedAnswerId && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleNext} className="gap-2">
              {currentIndex + 1 >= questions.length ? ts('common.finish') : ts('common.next')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
