'use client';

import Link from 'next/link';
import type { AnimatedQuestion, Locale, LocalizedText } from '../types';

const titleText: LocalizedText = { uzLatin: 'Natijalar', uz: 'Натижалар', ru: 'Результаты' };
const correctLabel: LocalizedText = { uzLatin: "To'g'ri", uz: 'Тўғри', ru: 'Правильных' };
const wrongLabel: LocalizedText = { uzLatin: "Noto'g'ri", uz: 'Нотўғри', ru: 'Неправильных' };
const tryAgainText: LocalizedText = { uzLatin: 'Qayta urinish', uz: 'Қайта уриниш', ru: 'Попробовать снова' };
const historyText: LocalizedText = { uzLatin: 'Tarix', uz: 'Тарих', ru: 'История' };
const questionListTitle: LocalizedText = { uzLatin: 'Savollar', uz: 'Саволлар', ru: 'Вопросы' };

interface ScoreSummaryProps {
  questions: AnimatedQuestion[];
  answers: Record<string, string>;
  locale: Locale;
  onRestart: () => void;
}

function getEmoji(pct: number): string {
  if (pct >= 90) return '🏆';
  if (pct >= 70) return '✅';
  if (pct >= 50) return '⚠️';
  return '❌';
}

function getGrade(pct: number): { text: string; color: string } {
  if (pct >= 90) return { text: 'A\'lo', color: 'text-emerald-400' };
  if (pct >= 70) return { text: 'Yaxshi', color: 'text-blue-400' };
  if (pct >= 50) return { text: 'Qoniqarli', color: 'text-amber-400' };
  return { text: 'Qayta urinish kerak', color: 'text-red-400' };
}

export default function ScoreSummary({
  questions,
  answers,
  locale,
  onRestart,
}: ScoreSummaryProps) {
  const total = questions.length;
  const correctCount = questions.filter((q) => {
    const selectedId = answers[q.id];
    const correctId = q.options.find((o) => o.correct)?.id;
    return selectedId === correctId;
  }).length;
  const wrongCount = total - correctCount;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const grade = getGrade(percentage);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <h2 className="mb-6 text-center text-xl font-bold text-white/90 sm:text-2xl">
        {titleText[locale]}
      </h2>

      <div className="mb-6 flex flex-col items-center gap-3">
        <span className="text-5xl">{getEmoji(percentage)}</span>
        <span className="text-5xl font-extrabold text-white tabular-nums sm:text-6xl">
          {percentage}%
        </span>
        <span className={`text-sm font-medium ${grade.color}`}>{grade.text}</span>
      </div>

      <div className="mb-6 flex justify-center gap-8 text-sm">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
          <span className="text-white/60">
            {correctLabel[locale]}: <span className="font-bold text-white/90">{correctCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
          <span className="text-white/60">
            {wrongLabel[locale]}: <span className="font-bold text-white/90">{wrongCount}</span>
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
          {questionListTitle[locale]}
        </h3>
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => {
            const selectedId = answers[q.id];
            const correctId = q.options.find((o) => o.correct)?.id;
            const wasCorrect = selectedId === correctId;

            return (
              <div
                key={q.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-sm"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                    wasCorrect ? 'bg-emerald-500/80' : 'bg-red-500/80'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-white/60 line-clamp-2 text-[13px]">
                  {q.question[locale]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
        >
          {tryAgainText[locale]}
        </button>
        <Link
          href="/animated-test/history"
          className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.1]"
        >
          {historyText[locale]}
        </Link>
      </div>
    </div>
  );
}
