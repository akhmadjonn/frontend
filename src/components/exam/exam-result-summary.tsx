'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';
interface ExamResultSummaryProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  timeTakenSeconds: number | null;
}

export default function ExamResultSummary({ score, correctAnswers, totalQuestions, passingScore, passed, timeTakenSeconds }: ExamResultSummaryProps) {
  const pct = Math.round((correctAnswers / totalQuestions) * 100);
  const minutes = timeTakenSeconds ? Math.floor(timeTakenSeconds / 60) : 0;
  const seconds = timeTakenSeconds ? timeTakenSeconds % 60 : 0;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Score circle */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="56" strokeWidth="8" className="stroke-muted fill-none" />
          <circle
            cx="64" cy="64" r="56" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className={cn('fill-none transition-all duration-1000', passed ? 'stroke-green-500' : 'stroke-red-500')}
          />
        </svg>
        <div className="text-center">
          <p className="text-3xl font-bold">{correctAnswers}</p>
          <p className="text-xs text-muted-foreground">/{totalQuestions}</p>
        </div>
      </div>

      {/* Pass/fail badge */}
      <div className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
        {passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {passed ? "O'tdingiz!" : "O'ta olmadingiz"}
      </div>

      {/* Stats row */}
      <div className="flex gap-6 text-sm">
        <div className="text-center">
          <p className="text-lg font-bold">{pct}%</p>
          <p className="text-muted-foreground">Aniqlik</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{minutes}:{String(seconds).padStart(2, '0')}</p>
          <p className="text-muted-foreground">Vaqt</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{passingScore}%</p>
          <p className="text-muted-foreground">O'tish bali</p>
        </div>
      </div>
    </div>
  );
}
