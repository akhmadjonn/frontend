'use client';

import type { AnimatedQuestion, Locale, LocalizedText } from '../types';

const nextButtonText: LocalizedText = {
  uzLatin: 'Keyingi savol',
  uz: 'Кейинги савол',
  ru: 'Следующий вопрос',
};

const correctText: LocalizedText = {
  uzLatin: "To'g'ri javob!",
  uz: "Тўғри жавоб!",
  ru: 'Правильный ответ!',
};

const wrongText: LocalizedText = {
  uzLatin: "Noto'g'ri javob",
  uz: "Нотўғри жавоб",
  ru: 'Неправильный ответ',
};

const pddLabel: LocalizedText = {
  uzLatin: 'YHQ havolasi',
  uz: 'ЙҲҚ ҳаволаси',
  ru: 'Ссылка на ПДД',
};

interface ResultCardProps {
  question: AnimatedQuestion;
  selectedOptionId: string;
  locale: Locale;
  onNext: () => void;
}

export default function ResultCard({
  question,
  selectedOptionId,
  locale,
  onNext,
}: ResultCardProps) {
  const correctOptionId = question.options.find((o) => o.correct)?.id;
  const isCorrect = selectedOptionId === correctOptionId;

  return (
    <div
      className="w-full rounded-2xl border p-4 shadow-xl backdrop-blur-sm sm:p-5"
      style={{
        borderColor: isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        background: isCorrect
          ? 'linear-gradient(to bottom, rgba(34,197,94,0.08), rgba(34,197,94,0.02))'
          : 'linear-gradient(to bottom, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        {isCorrect ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/20">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <h3 className={`text-lg font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
          {isCorrect ? correctText[locale] : wrongText[locale]}
        </h3>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-white/70 sm:text-[15px]">
        {question.explanation[locale]}
      </p>

      {question.pddReference && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-white/50 ring-1 ring-white/10">
          <span className="font-medium text-white/60">{pddLabel[locale]}:</span>
          <span className="font-mono text-blue-400">{question.pddReference}</span>
        </p>
      )}

      <button
        type="button"
        onClick={onNext}
        className="mt-2 w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98] sm:w-auto"
      >
        {nextButtonText[locale]} →
      </button>
    </div>
  );
}
