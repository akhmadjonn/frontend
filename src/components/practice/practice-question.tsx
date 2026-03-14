'use client';

import { useState, useCallback } from 'react';
import { useLocaleStore } from '@/stores/locale-store';
import { cn } from '@/lib/utils';
import { Check, Box } from 'lucide-react';

interface AnswerOptionDto {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
}

interface PracticeQuestionData {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  categoryName: { uz: string; uzLatin: string; ru: string };
  difficulty: number;
  answerOptions: AnswerOptionDto[];
  leitnerBox: number;
}

interface PracticeQuestionProps {
  question: PracticeQuestionData;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answerId: string) => void;
  disabled?: boolean;
  selectedAnswerId?: string;
  correctAnswerId?: string;
}

const LEITNER_COLORS = [
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
];

export default function PracticeQuestion({
  question, questionNumber, totalQuestions, onAnswer, disabled, selectedAnswerId, correctAnswerId,
}: PracticeQuestionProps) {
  const language = useLocaleStore((s) => s.language);
  const locale = language as 'uz' | 'uzLatin' | 'ru';
  const questionText = question.text[locale] ?? question.text.uzLatin;
  const answersHaveImages = question.answerOptions.some((o) => !!o.imageUrl);
  const boxIndex = Math.max(0, Math.min(question.leitnerBox - 1, 4));

  const handleSelect = useCallback((id: string) => {
    if (!disabled && !selectedAnswerId) onAnswer(id);
  }, [disabled, selectedAnswerId, onAnswer]);

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{questionNumber}/{totalQuestions}</span>
        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${LEITNER_COLORS[boxIndex]}`}>
          <Box className="h-2.5 w-2.5" />
          Box {question.leitnerBox}
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 p-4">
        <p className="text-base font-medium leading-relaxed">{questionText}</p>
        {question.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-lg">
            <img src={question.imageUrl} alt={questionText} className="h-48 w-full object-contain" />
          </div>
        )}
      </div>

      <div className={answersHaveImages ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}>
        {question.answerOptions.map((option) => {
          const text = option.text[locale] ?? option.text.uzLatin;
          const isSelected = selectedAnswerId === option.id;
          const isCorrect = correctAnswerId === option.id;
          const isIncorrect = !!(correctAnswerId && isSelected && correctAnswerId !== option.id);
          const isAnswered = !!selectedAnswerId;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={!!selectedAnswerId || disabled}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !isAnswered && 'hover:border-primary/50 hover:bg-muted/50',
                isSelected && !isCorrect && !isIncorrect && 'border-primary bg-primary/5',
                isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                isIncorrect && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                isAnswered && !isSelected && !isCorrect && 'opacity-60',
              )}
            >
              {option.imageUrl && (
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded">
                  <img src={option.imageUrl} alt={text} className="h-full w-full object-cover" />
                </div>
              )}
              <span className="flex-1 leading-snug">{text}</span>
              {isCorrect && <Check className="h-4 w-4 shrink-0 text-green-600" />}
              {isIncorrect && <span className="h-4 w-4 shrink-0 rounded-full bg-red-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
