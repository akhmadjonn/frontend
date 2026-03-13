'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useExamStore } from '@/stores/exam-store';
import { useLocaleStore } from '@/stores/locale-store';
import ExamResultSummary from '@/components/exam/exam-result-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AnswerOptionDto {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
}

interface ExamResultQuestion {
  questionId: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  selectedAnswerId: string | null;
  correctAnswerId: string;
  isCorrect: boolean;
  explanation: { uz: string; uzLatin: string; ru: string } | null;
  timeSpentSeconds: number | null;
  answerOptions?: AnswerOptionDto[];
}

interface ExamResult {
  examId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  timeTakenSeconds: number;
  completedAt: string;
  questions: ExamResultQuestion[];
}

function QuestionReviewItem({ question, index, locale }: { question: ExamResultQuestion; index: number; locale: 'uz' | 'uzLatin' | 'ru' }) {
  const [expanded, setExpanded] = useState(false);
  const text = question.text[locale] ?? question.text.uzLatin;
  const explanation = question.explanation?.[locale] ?? question.explanation?.uzLatin;

  return (
    <div className={cn('rounded-lg border p-3', question.isCorrect ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : 'border-red-200 bg-red-50/50 dark:bg-red-900/10')}>
      <div className="flex items-start gap-2">
        {question.isCorrect
          ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{index + 1}. {text}</p>
          {question.imageUrl && (
            <div className="relative mt-2 h-28 w-full overflow-hidden rounded">
              <Image src={question.imageUrl} alt="" fill className="object-contain" sizes="400px" />
            </div>
          )}
          {!question.isCorrect && (
            <button onClick={() => setExpanded(!expanded)} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Yashirish' : "Tushuntirishni ko'rish"}
            </button>
          )}
          {!question.isCorrect && expanded && explanation && (
            <p className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">{explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { language } = useLocaleStore();
  const { reset } = useExamStore();
  const locale = language as 'uz' | 'uzLatin' | 'ru';
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    reset(); // clear exam state after viewing result
    apiClient.get<ExamResult>(`/exams/${examId}/result`)
      .then(setResult)
      .catch(() => router.replace('/exam'))
      .finally(() => setLoading(false));
  }, [examId, reset, router]);

  if (loading)
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (!result) return null;

  const incorrectQuestions = result.questions.filter((q) => !q.isCorrect);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-2">
          <ExamResultSummary
            score={result.score}
            correctAnswers={result.correctAnswers}
            totalQuestions={result.totalQuestions}
            passingScore={result.passingScore}
            passed={result.passed}
            timeTakenSeconds={result.timeTakenSeconds}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button className="flex-1" onClick={() => router.push('/exam')}>
          <RefreshCw className="h-4 w-4 mr-2" />Qayta urinish
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
          <Home className="h-4 w-4 mr-2" />Bosh sahifa
        </Button>
      </div>

      {/* Question review */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Xatolar ({incorrectQuestions.length})
          </CardTitle>
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-primary hover:underline">
            {showAll ? "Faqat xatolar" : "Barcha savollar"}
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.questions
            .filter((q) => showAll || !q.isCorrect)
            .map((q, i) => (
              <QuestionReviewItem key={q.questionId} question={q} index={i} locale={locale} />
            ))
          }
          {!showAll && incorrectQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Barcha javoblar to&apos;g&apos;ri!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
