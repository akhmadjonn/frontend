'use client';

import type { AnimatedQuestion, Locale, LocalizedText } from '../types';

const questionLabel: LocalizedText = {
  uzLatin: 'Savol',
  uz: 'Савол',
  ru: 'Вопрос',
};

interface ProgressBarProps {
  current: number;
  total: number;
  answers: Record<string, string>;
  questions: AnimatedQuestion[];
  locale: Locale;
}

function getAnswerStatus(
  question: AnimatedQuestion,
  answers: Record<string, string>,
): 'correct' | 'wrong' | 'unanswered' {
  const selectedOptionId = answers[question.id];
  if (!selectedOptionId) return 'unanswered';
  const selectedOption = question.options.find((o) => o.id === selectedOptionId);
  return selectedOption?.correct ? 'correct' : 'wrong';
}

export default function ProgressBar({
  current,
  total,
  answers,
  questions,
  locale,
}: ProgressBarProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/50">
          {questionLabel[locale]}{' '}
          <span className="text-white/90 font-bold tabular-nums">
            {current + 1}
          </span>
          <span className="text-white/30"> / {total}</span>
        </span>
        <span className="text-xs font-medium text-white/40 tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #3B82F6, #6366F1)',
          }}
        />
      </div>

      <div className="overflow-x-auto pb-1 -mb-1">
        <div className="flex items-center gap-1.5 min-w-max">
          {questions.map((question, index) => {
            const isCurrent = index === current;
            const status = getAnswerStatus(question, answers);

            let dotClass = 'h-2.5 w-2.5 rounded-full shrink-0 transition-all duration-300';

            if (isCurrent) {
              dotClass += ' ring-2 ring-blue-500/60 ring-offset-1 ring-offset-[#0f172a] bg-blue-500/40 scale-125';
            } else if (status === 'correct') {
              dotClass += ' bg-emerald-500';
            } else if (status === 'wrong') {
              dotClass += ' bg-red-500';
            } else {
              dotClass += ' bg-white/10';
            }

            return <div key={question.id} className={dotClass} />;
          })}
        </div>
      </div>
    </div>
  );
}
