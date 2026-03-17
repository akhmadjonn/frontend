'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePracticeStore } from '@/stores/practice-store';
import PracticeQuestion from '@/components/practice/practice-question';
import ExplanationPanel from '@/components/practice/explanation-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { PRACTICE_BATCH_SIZE } from '@/lib/constants';
import { useLocale } from '@/hooks/use-locale';

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

export default function PracticeSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const { ts } = useLocale();

  const { questions, currentIndex, answers, batchComplete, setQuestions, addAnswer, nextQuestion, completeBatch, reset } = usePracticeStore();

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());

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
    reset();
    fetchSession();
    return () => reset();
  }, [fetchSession, reset]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedAnswerId && !submitting) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnswerId, submitting, handleNext]);

  const handleNewBatch = useCallback(() => {
    reset();
    setFeedback(null);
    setSelectedAnswerId(null);
    startTimeRef.current = Date.now();
    fetchSession();
  }, [reset, fetchSession]);

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

  // Session summary
  if (batchComplete) {
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

  if (questions.length === 0)
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">{ts('practice.noQuestions')}</p>
        <Button variant="outline" onClick={() => router.push('/practice')}>{ts('common.back')}</Button>
      </div>
    );

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
