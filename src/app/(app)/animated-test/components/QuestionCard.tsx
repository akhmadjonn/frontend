'use client';

import type { AnimatedQuestion, Locale, LocalizedText, QuizPhase } from '../types';

const difficultyNames: Record<string, LocalizedText> = {
  easy: { uzLatin: 'Oson', uz: 'Осон', ru: 'Легко' },
  medium: { uzLatin: "O'rtacha", uz: 'Ўртача', ru: 'Средне' },
  hard: { uzLatin: 'Qiyin', uz: 'Қийин', ru: 'Сложно' },
};

const categoryNames: Record<string, LocalizedText> = {
  railway: { uzLatin: "Temir yo'l", uz: 'Темир йўл', ru: 'Ж/Д переезд' },
  intersection: { uzLatin: 'Chorrahа', uz: 'Чорраҳа', ru: 'Перекрёсток' },
  pedestrian: { uzLatin: "Piyodalar o'tish joyi", uz: 'Пиёдалар ўтиш жойи', ru: 'Пешеходный переход' },
  overtake: { uzLatin: "Qo'shib o'tish", uz: 'Қўшиб ўтиш', ru: 'Обгон' },
  traffic_light: { uzLatin: 'Svetofor', uz: 'Светофор', ru: 'Светофор' },
  roundabout: { uzLatin: 'Aylanma harakat', uz: 'Айланма ҳаракат', ru: 'Круговое движение' },
  speed_zone: { uzLatin: 'Tezlik chegarasi', uz: 'Тезлик чегараси', ru: 'Ограничение скорости' },
};

const categoryIcons: Record<string, string> = {
  railway: '🚂', intersection: '🔀', pedestrian: '🚶', overtake: '🚗',
  traffic_light: '🚦', roundabout: '🔄', speed_zone: '⚡',
};

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  hard: 'bg-red-500/15 text-red-400 ring-red-500/20',
};

interface QuestionCardProps {
  question: AnimatedQuestion;
  locale: Locale;
  selectedOption: string | null;
  phase: QuizPhase;
  onSelectOption: (optionId: string) => void;
}

export default function QuestionCard({
  question,
  locale,
  selectedOption,
  phase,
  onSelectOption,
}: QuestionCardProps) {
  const categoryLabel = categoryNames[question.category]?.[locale] ?? question.category;
  const difficultyLabel = difficultyNames[question.difficulty]?.[locale] ?? question.difficulty;
  const isInteractive = phase === 'question';
  const isDisabled = phase === 'animating' || phase === 'result';
  const correctOptionId = question.options.find((o) => o.correct)?.id;

  function getOptionClasses(optionId: string): string {
    const base = 'group w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-300 sm:text-base';

    if (phase === 'result') {
      if (optionId === correctOptionId)
        return `${base} border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]`;
      if (optionId === selectedOption && optionId !== correctOptionId)
        return `${base} border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]`;
      return `${base} border-white/5 bg-white/[0.02] text-white/30`;
    }

    if (optionId === selectedOption)
      return `${base} border-blue-500/50 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.15)]`;

    if (isInteractive)
      return `${base} border-white/10 bg-white/[0.03] text-white/80 hover:border-blue-400/40 hover:bg-blue-500/[0.06] hover:text-white cursor-pointer hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]`;

    return `${base} border-white/5 bg-white/[0.02] text-white/40`;
  }

  function getLetterClasses(optionId: string): string {
    const base = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300';

    if (phase === 'result') {
      if (optionId === correctOptionId) return `${base} bg-emerald-500/20 text-emerald-400`;
      if (optionId === selectedOption) return `${base} bg-red-500/20 text-red-400`;
      return `${base} bg-white/5 text-white/20`;
    }

    if (optionId === selectedOption) return `${base} bg-blue-500/20 text-blue-400`;
    if (isInteractive) return `${base} bg-white/5 text-white/50 group-hover:bg-blue-500/15 group-hover:text-blue-400`;
    return `${base} bg-white/5 text-white/30`;
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-xl backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-white/70 ring-1 ring-white/10">
          <span>{categoryIcons[question.category] ?? '📋'}</span>
          {categoryLabel}
        </span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${difficultyColors[question.difficulty] ?? ''}`}>
          {difficultyLabel}
        </span>
      </div>

      <h2 className="mb-5 text-[15px] font-semibold leading-relaxed text-white/90 sm:text-base">
        {question.question[locale]}
      </h2>

      <div className="flex flex-col gap-2.5">
        {question.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={isDisabled}
            onClick={() => isInteractive && onSelectOption(option.id)}
            className={getOptionClasses(option.id)}
          >
            <span className={getLetterClasses(option.id)}>
              {String.fromCharCode(65 + index)}
            </span>
            <span className="flex-1">{option.text[locale]}</span>
            {phase === 'result' && (option.id === correctOptionId || option.id === selectedOption) && (
              <span className="text-sm font-bold">
                {option.id === correctOptionId ? '✓' : option.id === selectedOption ? '✗' : ''}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
