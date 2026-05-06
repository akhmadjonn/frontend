'use client';

import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

interface MarafonExplanationPanelProps {
  isCorrect: boolean;
  explanation: { uz: string; uzLatin: string; ru: string } | null;
}

export default function MarafonExplanationPanel({ isCorrect, explanation }: MarafonExplanationPanelProps) {
  const { t, ts } = useLocale();
  const explanationText = explanation ? t(explanation) : '';

  return (
    <Card className={isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          {isCorrect
            ? <CheckCircle className="h-5 w-5 text-green-600" />
            : <XCircle className="h-5 w-5 text-red-600" />}
          <span className={isCorrect ? 'font-semibold text-green-700 dark:text-green-400' : 'font-semibold text-red-700 dark:text-red-400'}>
            {isCorrect ? ts('exam.correct') : ts('exam.wrong')}
          </span>
        </div>
        {explanationText && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{explanationText}</p>
        )}
      </CardContent>
    </Card>
  );
}
