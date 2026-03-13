'use client';

import { cn } from '@/lib/utils';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIds: Set<string>;
  questionIds: string[];
  onNavigate: (index: number) => void;
}

export default function QuestionNavigator({ totalQuestions, currentIndex, answeredIds, questionIds, onNavigate }: QuestionNavigatorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: totalQuestions }, (_, i) => {
        const answered = answeredIds.has(questionIds[i]);
        const current = i === currentIndex;
        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            aria-label={`Savol ${i + 1}`}
            aria-current={current ? 'true' : undefined}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors',
              current
                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                : answered
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
