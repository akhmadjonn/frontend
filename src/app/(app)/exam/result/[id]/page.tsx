'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useExamStore } from '@/stores/exam-store';
import { useLocale } from '@/hooks/use-locale';
import ExamResultSummary from '@/components/exam/exam-result-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, RefreshCw, Home, ChevronDown, ChevronUp, Share2, Copy, Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  correctAnswerId: string | null;
  isCorrect: boolean | null;
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
  timeTakenSeconds: number | null;
  completedAt: string | null;
  questions: ExamResultQuestion[];
}

function QuestionReviewItem({ question, index, locale, ts }: { question: ExamResultQuestion; index: number; locale: 'uz' | 'uzLatin' | 'ru'; ts: (key: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const text = question.text[locale] ?? question.text.uzLatin;
  const explanation = question.explanation?.[locale] ?? question.explanation?.uzLatin;

  return (
    <div className={cn('rounded-xl p-4 border-border/50', question.isCorrect ? 'border-green-200/60 bg-green-50/30 dark:bg-green-900/10' : 'border-red-200/60 bg-red-50/30 dark:bg-red-900/10')}>
      <div className="flex items-start gap-2">
        {question.isCorrect
          ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{index + 1}. {text}</p>
          {question.imageUrl && (
            <div className="mt-2 overflow-hidden rounded">
              <img src={question.imageUrl} alt="" className="h-28 w-full object-contain" />
            </div>
          )}
          {!question.isCorrect && (
            <button onClick={() => setExpanded(!expanded)} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? ts('result.hide') : ts('result.showExplanation')}
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
  const { language, ts } = useLocale();
  const reset = useExamStore((s) => s.reset);
  const locale = language as 'uz' | 'uzLatin' | 'ru';
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    reset();
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
    <div className="max-w-2xl mx-auto space-y-6 py-4 animate-fade-up">
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

      <div className="flex flex-wrap gap-2">
        <Button className="flex-1 btn-gradient-blue text-white rounded-xl h-11" onClick={() => router.push('/exam')}>
          <RefreshCw className="h-4 w-4 mr-2" />{ts('result.retry')}
        </Button>
        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => router.push('/dashboard')}>
          <Home className="h-4 w-4 mr-2" />{ts('result.home')}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full gap-2 rounded-xl h-11"
          onClick={async () => {
            const percent = Math.round((result.correctAnswers / result.totalQuestions) * 100);
            const shareText = ts('share.shareText')
              .replace('{score}', String(result.correctAnswers))
              .replace('{total}', String(result.totalQuestions))
              .replace('{percent}', String(percent));
            const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

            if (typeof navigator !== 'undefined' && navigator.share) {
              try {
                await navigator.share({ title: 'Avtolider', text: shareText, url: shareUrl });
              } catch {
                // user cancelled share
              }
            } else {
              setShowShareOptions((prev) => !prev);
            }
          }}
        >
          <Share2 className="h-4 w-4" />{ts('share.shareResult')}
        </Button>

        {showShareOptions && (() => {
          const percent = Math.round((result.correctAnswers / result.totalQuestions) * 100);
          const shareText = ts('share.shareText')
            .replace('{score}', String(result.correctAnswers))
            .replace('{total}', String(result.totalQuestions))
            .replace('{percent}', String(percent));
          const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
          const encodedText = encodeURIComponent(shareText + '\n' + shareUrl);
          const encodedUrl = encodeURIComponent(shareUrl);
          const telegramText = encodeURIComponent(shareText);

          return (
            <div className="flex gap-2">
              <a
                href={`https://t.me/share/url?url=${encodedUrl}&text=${telegramText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <Send className="h-4 w-4" />{ts('share.shareToTelegram')}
                </Button>
              </a>
              <a
                href={`https://wa.me/?text=${encodedText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <MessageCircle className="h-4 w-4" />{ts('share.shareToWhatsApp')}
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    toast.success(ts('share.copied'));
                  });
                }}
              >
                <Copy className="h-4 w-4" />{ts('share.copyLink')}
              </Button>
            </div>
          );
        })()}
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {ts('result.errors')} ({incorrectQuestions.length})
          </CardTitle>
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-primary hover:underline">
            {showAll ? ts('result.onlyErrors') : ts('result.allQuestions')}
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.questions
            .filter((q) => showAll || !q.isCorrect)
            .map((q, i) => (
              <QuestionReviewItem key={q.questionId} question={q} index={i} locale={locale} ts={ts} />
            ))
          }
          {!showAll && incorrectQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{ts('result.allCorrect')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
