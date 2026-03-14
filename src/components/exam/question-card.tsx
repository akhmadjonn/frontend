'use client';

import { memo } from 'react';
import { useLocaleStore } from '@/stores/locale-store';
import AnswerOption from './answer-option';

interface AnswerOptionDto {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
}

interface ExamQuestion {
  id: string;
  questionId: string;
  order: number;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  answerOptions: AnswerOptionDto[];
}

interface QuestionCardProps {
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswerId?: string;
  onSelectAnswer: (answerId: string) => void;
  disabled?: boolean;
  revealCorrectId?: string;
}

export default memo(function QuestionCard({ question, questionNumber, totalQuestions, selectedAnswerId, onSelectAnswer, disabled, revealCorrectId }: QuestionCardProps) {
  const language = useLocaleStore((s) => s.language);
  const locale = language as 'uz' | 'uzLatin' | 'ru';
  const questionText = question.text[locale] ?? question.text.uzLatin;
  const hasQuestionImage = !!question.imageUrl;

  // Detect image layout: all answer options have images -> 2-column grid; otherwise list
  const answersHaveImages = question.answerOptions.some((o) => !!o.imageUrl);

  return (
    <div className="space-y-4 select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      {/* Question header */}
      <div className="text-xs font-medium text-muted-foreground">
        {questionNumber}/{totalQuestions} — savol
      </div>

      {/* Question text */}
      <div className="rounded-xl bg-muted/30 p-4">
        <p className="text-base font-medium leading-relaxed">{questionText}</p>
        {hasQuestionImage && (
          <div className="mt-3 overflow-hidden rounded-lg">
            <img
              src={question.imageUrl!}
              alt={questionText}
              className="h-48 w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Answer options */}
      <div className={answersHaveImages ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}>
        {question.answerOptions.map((option) => (
          <AnswerOption
            key={option.id}
            option={option}
            selected={selectedAnswerId === option.id}
            onSelect={onSelectAnswer}
            disabled={disabled}
            correct={revealCorrectId === option.id}
            incorrect={!!(revealCorrectId && selectedAnswerId === option.id && revealCorrectId !== option.id)}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
});
