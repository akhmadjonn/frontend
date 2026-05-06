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
import MarafonExplanationPanel from '@/components/exam/marafon-explanation-panel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

type LocalizedText = { uz: string; uzLatin: string; ru: string };

interface AnswerOptionDto {
  id: string;
  text: LocalizedText;
  imageUrl: string | null;
}

interface ExamQuestionDto {
  id: string;
  questionId: string;
  order: number;
  text: LocalizedText;
  imageUrl: string | null;
  answerOptions: AnswerOptionDto[];
  selectedAnswerId?: string | null;
  correctAnswerId?: string | null;
  isCorrect?: boolean | null;
  explanation?: LocalizedText | null;
}

interface ExamAnswerFeedbackDto {
  isCorrect: boolean;
  correctAnswerId: string;
  explanation: LocalizedText | null;
}

interface ExamQuestionsBatchDto {
  from: number;
  take: number;
  totalQuestions: number;
  questions: ExamQuestionDto[];
}

const MARAFON_PREFETCH_LOOKAHEAD = 5; // when within N of the loaded tail, fetch next batch
const MARAFON_BATCH_SIZE = 20;

export default function ExamSessionPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { ts } = useLocale();
  const { questions, totalQuestions, currentIndex, answers, feedback, expiresAt, status, mode } = useExamStore(
    useShallow((s) => ({
      questions: s.questions,
      totalQuestions: s.totalQuestions,
      currentIndex: s.currentIndex,
      answers: s.answers,
      feedback: s.feedback,
      expiresAt: s.expiresAt,
      status: s.status,
      mode: s.mode,
    })),
  );
  const goToQuestion = useExamStore((s) => s.goToQuestion);
  const selectAnswer = useExamStore((s) => s.selectAnswer);
  const setFeedback = useExamStore((s) => s.setFeedback);
  const appendQuestions = useExamStore((s) => s.appendQuestions);
  const submitExam = useExamStore((s) => s.submitExam);
  const incrementTabSwitch = useExamStore((s) => s.incrementTabSwitch);
  const [completing, setCompleting] = useState(false);
  const [submittingQid, setSubmittingQid] = useState<string | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<{ qid: string; aid: string } | null>(null);
  const submittedRef = useRef(false);
  const inflightBatchRef = useRef<Set<number>>(new Set()); // ranges currently being prefetched

  useEffect(() => {
    if (status === 'idle' || questions.length === 0) {
      router.replace('/exam');
    }
  }, [status, questions.length, router]);

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

  // Marafon: prefetch next batch when user nears the tail of currently-loaded questions
  useEffect(() => {
    if (mode !== 'marathon') return;
    if (questions.length === 0) return;
    if (questions.length >= totalQuestions) return;

    const loadedTailOrder = questions[questions.length - 1].order;
    const currentOrder = questions[currentIndex]?.order ?? 0;
    if (loadedTailOrder - currentOrder > MARAFON_PREFETCH_LOOKAHEAD) return;

    const nextFrom = loadedTailOrder + 1;
    if (nextFrom > totalQuestions) return;
    if (inflightBatchRef.current.has(nextFrom)) return;

    inflightBatchRef.current.add(nextFrom);
    apiClient
      .get<ExamQuestionsBatchDto>(`/exams/${examId}/questions?from=${nextFrom}&take=${MARAFON_BATCH_SIZE}`)
      .then((batch) => {
        if (batch?.questions?.length) appendQuestions(batch.questions);
      })
      .catch((err) => {
        console.warn('[exam] marafon batch prefetch failed', err);
      })
      .finally(() => {
        inflightBatchRef.current.delete(nextFrom);
      });
  }, [mode, questions, totalQuestions, currentIndex, examId, appendQuestions]);

  const handleSubmitAnswer = useCallback(
    async (sessionQuestionId: string, answerId: string) => {
      if (!sessionQuestionId) return;
      // Already answered locally — ignore (lock-first-answer mirror)
      if (answers.has(sessionQuestionId)) return;
      if (submittingQid) return;

      setSubmittingQid(sessionQuestionId);
      setPendingAnswer({ qid: sessionQuestionId, aid: answerId });
      try {
        const fb = await apiClient.post<ExamAnswerFeedbackDto>(`/exams/${examId}/answer`, {
          sessionQuestionId,
          selectedAnswerId: answerId,
        });
        // Server is authoritative — commit only after success.
        selectAnswer(sessionQuestionId, answerId);
        if (fb) {
          setFeedback(sessionQuestionId, {
            isCorrect: fb.isCorrect,
            correctAnswerId: fb.correctAnswerId,
            explanation: fb.explanation ?? null,
          });
        }
      } catch {
        toast.warning(ts('exam.answerSaveFailed'));
      } finally {
        setSubmittingQid(null);
        setPendingAnswer(null);
      }
    },
    [examId, answers, submittingQid, selectAnswer, setFeedback, ts],
  );

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
  const totalKnown = totalQuestions || questions.length;
  const isMarathon = mode === 'marathon';
  const progressPct = totalKnown > 0 ? Math.round((answeredCount / totalKnown) * 100) : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (currentIndex < questions.length - 1) {
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
  }, [currentIndex, questions.length, goToQuestion]);

  const handleSelectForCurrentQuestion = useCallback(
    (answerId: string) => {
      if (!currentQuestion) return;
      handleSubmitAnswer(currentQuestion.id, answerId);
    },
    [handleSubmitAnswer, currentQuestion],
  );

  if (status === 'idle' || questions.length === 0) return null;

  const currentFeedback = currentQuestion ? feedback.get(currentQuestion.id) ?? null : null;
  const committedAnswerId = currentQuestion ? answers.get(currentQuestion.id) : undefined;
  const previewAnswerId =
    pendingAnswer && currentQuestion && pendingAnswer.qid === currentQuestion.id ? pendingAnswer.aid : undefined;
  const displayedSelectedAnswerId = committedAnswerId ?? previewAnswerId;
  const isSubmittingHere = !!currentQuestion && submittingQid === currentQuestion.id;
  const isLockedForRevisit = !!currentFeedback || isSubmittingHere;
  const showMarafonExplanation = isMarathon && currentFeedback;

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
                {answeredCount}/{totalKnown}
              </span>
            ) : (
              <span className="text-sm font-medium">
                {currentIndex + 1}/{totalKnown}
              </span>
            )}
            <Progress value={progressPct} className="w-24 h-1.5" />
          </div>
          {!isMarathon && expiresAt && (
            <ExamTimer expiresAt={expiresAt} onExpire={handleComplete} />
          )}
          <Button size="sm" onClick={handleComplete} disabled={completing} className="shrink-0">
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {completing ? ts('exam.completing') : ts('exam.finish')}
          </Button>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={totalKnown}
          selectedAnswerId={displayedSelectedAnswerId}
          onSelectAnswer={handleSelectForCurrentQuestion}
          disabled={isLockedForRevisit}
          revealCorrectId={currentFeedback?.correctAnswerId}
        />

        {showMarafonExplanation && currentFeedback && (
          <MarafonExplanationPanel
            isCorrect={currentFeedback.isCorrect}
            explanation={currentFeedback.explanation}
          />
        )}

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
              totalQuestions={questions.length}
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
            disabled={currentIndex === questions.length - 1}
          >
            {ts('common.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {answeredCount === totalKnown && totalKnown > 0 ? (
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
        ) : answeredCount > 0 && currentIndex === questions.length - 1 && questions.length === totalKnown ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {ts('exam.unansweredCount').replace('{count}', String(totalKnown - answeredCount))}
            </p>
            <Button variant="outline" onClick={handleComplete} disabled={completing} className="rounded-xl">
              {completing ? ts('exam.completing') : ts('exam.finishAnyway')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
