'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useExamStore } from '@/stores/exam-store';
import { useShallow } from 'zustand/react/shallow';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import QuestionCard from '@/components/exam/question-card';
import QuestionNavigator from '@/components/exam/question-navigator';
import ExamTimer from '@/components/exam/exam-timer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

export default function ExamSessionPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { ts } = useLocale();
  const { questions, currentIndex, answers, expiresAt, status, mode } = useExamStore(
    useShallow((s) => ({ questions: s.questions, currentIndex: s.currentIndex, answers: s.answers, expiresAt: s.expiresAt, status: s.status, mode: s.mode }))
  );
  const goToQuestion = useExamStore((s) => s.goToQuestion);
  const selectAnswer = useExamStore((s) => s.selectAnswer);
  const submitExam = useExamStore((s) => s.submitExam);
  const incrementTabSwitch = useExamStore((s) => s.incrementTabSwitch);
  const [completing, setCompleting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (status === 'idle' || questions.length === 0) {
      router.replace('/exam');
    }
  }, [status, questions.length, router]);

  // Validate exam hasn't expired on mount (handles stale sessionStorage restore)
  useEffect(() => {
    if (expiresAt && mode !== 'marathon' && new Date(expiresAt).getTime() < Date.now()) {
      toast.warning(ts('exam.sessionExpired'));
      router.replace('/exam');
    }
  }, [expiresAt, mode, router, ts]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        incrementTabSwitch();
        toast.warning(ts('exam.tabSwitchWarning'));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [incrementTabSwitch, ts]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mode !== 'marathon') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode]);

  const handleSubmitAnswer = useCallback(async (sessionQuestionId: string, answerId: string) => {
    selectAnswer(sessionQuestionId, answerId);
    try {
      await apiClient.post(`/exams/${examId}/answer`, {
        sessionQuestionId,
        selectedAnswerId: answerId,
      });
    } catch {
      toast.warning(ts('exam.answerSaveFailed'));
    }
  }, [examId, selectAnswer, ts]);

  const handleComplete = useCallback(async () => {
    if (submittedRef.current || completing) return;
    submittedRef.current = true;
    setCompleting(true);
    try {
      await apiClient.post(`/exams/${examId}/complete`, {});
      submitExam();
      router.replace(`/exam/result/${examId}`);
    } catch (err: unknown) {
      submittedRef.current = false;
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setCompleting(false);
    }
  }, [examId, submitExam, router, completing, ts]);

  const currentQuestion = questions[currentIndex];
  const answeredIds = useMemo(() => new Set(answers.keys()), [answers]);
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const answeredCount = answers.size;
  const totalQuestions = questions.length;
  const isMarathon = mode === 'marathon';
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (currentIndex < totalQuestions - 1) {
          e.preventDefault();
          goToQuestion(currentIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          e.preventDefault();
          goToQuestion(currentIndex - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, goToQuestion]);

  const handleSelectForCurrentQuestion = useCallback(
    (answerId: string) => handleSubmitAnswer(currentQuestion?.id, answerId),
    [handleSubmitAnswer, currentQuestion?.id]
  );

  if (status === 'idle' || questions.length === 0) return null;

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-3.5rem)]"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {isMarathon ? (
              <span className="text-sm font-medium text-muted-foreground truncate">
                {answeredCount}/{totalQuestions}
              </span>
            ) : (
              <span className="text-sm font-medium">
                {currentIndex + 1}/{totalQuestions}
              </span>
            )}
            <Progress value={progressPct} className="w-24 h-1.5" />
          </div>
          {!isMarathon && expiresAt && (
            <ExamTimer expiresAt={expiresAt} onExpire={handleComplete} />
          )}
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={completing}
            className="shrink-0"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {completing ? ts('exam.completing') : ts('exam.finish')}
          </Button>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
          selectedAnswerId={answers.get(currentQuestion.id)}
          onSelectAnswer={handleSelectForCurrentQuestion}
        />

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label={ts('common.previous')}
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            {ts('common.previous')}
          </Button>
          <div className="flex-1 overflow-x-auto">
            <QuestionNavigator
              totalQuestions={totalQuestions}
              currentIndex={currentIndex}
              answeredIds={answeredIds}
              questionIds={questionIds}
              onNavigate={goToQuestion}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-label={ts('common.next')}
            onClick={() => goToQuestion(currentIndex + 1)}
            disabled={currentIndex === totalQuestions - 1}
          >
            {ts('common.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom finish section — appears when all answered or on last question */}
        {answeredCount === totalQuestions ? (
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <p className="font-semibold">{ts('exam.allAnswered')}</p>
            </div>
            <p className="text-sm text-muted-foreground">{ts('exam.reviewOrFinish')}</p>
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 px-8"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {completing ? ts('exam.completing') : ts('exam.finishExam')}
            </Button>
          </div>
        ) : answeredCount > 0 && currentIndex === totalQuestions - 1 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {ts('exam.unansweredCount').replace('{count}', String(totalQuestions - answeredCount))}
            </p>
            <Button
              variant="outline"
              onClick={handleComplete}
              disabled={completing}
              className="rounded-xl"
            >
              {completing ? ts('exam.completing') : ts('exam.finishAnyway')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
