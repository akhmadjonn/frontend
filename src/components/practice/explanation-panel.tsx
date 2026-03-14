'use client';

import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Box, CalendarDays } from 'lucide-react';
import { LEITNER_INTERVALS } from '@/lib/constants';
import { format } from 'date-fns';

interface ExplanationPanelProps {
  isCorrect: boolean;
  explanation: { uz: string; uzLatin: string; ru: string } | null;
  newLeitnerBox: number;
  nextReviewDate: string | null;
}

const LEITNER_COLORS = [
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
];

export default function ExplanationPanel({ isCorrect, explanation, newLeitnerBox, nextReviewDate }: ExplanationPanelProps) {
  const { t } = useLocale();
  const boxIndex = Math.max(0, Math.min(newLeitnerBox - 1, 4));

  return (
    <Card className={isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {isCorrect
            ? <CheckCircle className="h-5 w-5 text-green-600" />
            : <XCircle className="h-5 w-5 text-red-600" />
          }
          <span className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {isCorrect ? "To'g'ri!" : "Noto'g'ri"}
          </span>
        </div>

        {explanation && t(explanation) && (
          <p className="text-sm text-muted-foreground leading-relaxed">{t(explanation)}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${LEITNER_COLORS[boxIndex]}`}>
            <Box className="h-3 w-3" />
            Box {newLeitnerBox}
          </div>

          {nextReviewDate && (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(nextReviewDate), 'dd.MM.yyyy')}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground">
            ({LEITNER_INTERVALS[boxIndex]} kun keyin)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
