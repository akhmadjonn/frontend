'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AnswerOptionItem {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
}

interface AnswerOptionProps {
  option: AnswerOptionItem;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  locale: 'uz' | 'uzLatin' | 'ru';
}

export default memo(function AnswerOption({ option, selected, onSelect, disabled, correct, incorrect, locale }: AnswerOptionProps) {
  const text = option.text[locale] ?? option.text.uzLatin;
  const hasImage = !!option.imageUrl;

  return (
    <button
      onClick={() => !disabled && onSelect(option.id)}
      disabled={disabled}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !disabled && 'hover:border-primary/50 hover:bg-muted/50',
        selected && !correct && !incorrect && 'border-primary bg-primary/5',
        correct && 'border-green-500 bg-green-50 dark:bg-green-900/20',
        incorrect && 'border-red-500 bg-red-50 dark:bg-red-900/20',
        disabled && !selected && !correct && !incorrect && 'opacity-60'
      )}
    >
      {hasImage ? (
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded">
          <img src={option.imageUrl!} alt={text} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <span className="flex-1 leading-snug">{text}</span>

      {selected && !correct && !incorrect && (
        <div className="h-4 w-4 shrink-0 rounded-full bg-primary" />
      )}
      {correct && <Check className="h-4 w-4 shrink-0 text-green-600" />}
      {incorrect && <span className="h-4 w-4 shrink-0 rounded-full bg-red-500" />}
    </button>
  );
});
