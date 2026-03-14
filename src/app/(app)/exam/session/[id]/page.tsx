'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useExamStore } from '@/stores/exam-store';
import { useShallow } from 'zustand/react/shallow';
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
  const { questions, currentIndex, answers, expiresAt, status, mode } = useExamStore(
    useShallow((s) => ({ questions: s.questions, currentIndex: s.currentIndex, answers: s.answers, expiresAt: s.expiresAt, status: s.status, mode: s.mode }))
  );
  const goToQuestion = useExamStore((s) => s.goToQuestion);
  const selectAnswer = useExamStore((s) => s.selectAnswer);
  const submitExam = useExamStore((s) => s.submitExam);
  const incrementTabSwitch = useExamStore((s) => s.incrementTabSwitch);
  const [completing, setCompleting] = useState(false);
  const submittedRef = useRef(false);

  // Redirect if no active exam
  useEffect(() => {
    if (status === 'idle' || questions.length === 0) {
      router.replace('/exam');
    }
  }, [status, questions.length, router]);

  // Anti-cheat: visibilitychange
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        incrementTabSwitch();
        toast.warning('Tab almashtirildi! Bu qayd etildi.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [incrementTabSwitch]);

  // Anti-cheat: beforeunload
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
      // Silent fail — answer already saved locally
    }
  }, [examId, selectAnswer]);

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
      toast.error(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setCompleting(false);
    }
  }, [examId, submitExam, router, completing]);

  const currentQuestion = questions[currentIndex];
  const answeredIds = useMemo(() => new Set(answers.keys()), [answers]);
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const answeredCount = answers.size;
  const totalQuestions = questions.length;
  const isMarathon = mode === 'marathon';
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

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
      {/* Sticky header */}
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
            {completing ? 'Yakunlanmoqda...' : 'Yakunlash'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Question card */}
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
          selectedAnswerId={answers.get(currentQuestion.id)}
          onSelectAnswer={handleSelectForCurrentQuestion}
        />

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Oldingi
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
            onClick={() => goToQuestion(currentIndex + 1)}
            disabled={currentIndex === totalQuestions - 1}
          >
            Keyingi
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
