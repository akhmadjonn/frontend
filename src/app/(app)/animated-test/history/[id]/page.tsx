'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { animatedQuestions } from '../../data/questions';
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { Locale } from '../../types';

interface SessionDetail {
  sessionId: string;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string;
  timeTakenSeconds: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    category: string;
    timeSpentMs: number;
    answeredAt: string;
  }>;
}

const texts = {
  title: { uzLatin: 'Test natijasi', uz: 'Тест натижаси', ru: 'Результат теста' },
  back: { uzLatin: 'Tarixga qaytish', uz: 'Тарихга қайтиш', ru: 'К истории' },
  correct: { uzLatin: "To'g'ri", uz: 'Тўғри', ru: 'Правильных' },
  wrong: { uzLatin: "Noto'g'ri", uz: 'Нотўғри', ru: 'Неправильных' },
  time: { uzLatin: 'Vaqt', uz: 'Вақт', ru: 'Время' },
  questions: { uzLatin: 'Savollar', uz: 'Саволлар', ru: 'Вопросы' },
  loading: { uzLatin: 'Yuklanmoqda...', uz: 'Юкланмоқда...', ru: 'Загрузка...' },
  notFound: { uzLatin: 'Sessiya topilmadi', uz: 'Сессия топилмади', ru: 'Сессия не найдена' },
  yourAnswer: { uzLatin: 'Sizning javobingiz', uz: 'Сизнинг жавобингиз', ru: 'Ваш ответ' },
  correctAnswer: { uzLatin: "To'g'ri javob", uz: 'Тўғри жавоб', ru: 'Правильный ответ' },
} as const;

const categoryNames: Record<string, { uzLatin: string; uz: string; ru: string }> = {
  railway: { uzLatin: "Temir yo'l", uz: 'Темир йўл', ru: 'Ж/Д переезд' },
  intersection: { uzLatin: 'Chorrahа', uz: 'Чорраҳа', ru: 'Перекрёсток' },
  pedestrian: { uzLatin: 'Piyodalar', uz: 'Пиёдалар', ru: 'Пешеходы' },
  overtake: { uzLatin: "Qo'shib o'tish", uz: 'Қўшиб ўтиш', ru: 'Обгон' },
  traffic_light: { uzLatin: 'Svetofor', uz: 'Светофор', ru: 'Светофор' },
  roundabout: { uzLatin: 'Aylanma', uz: 'Айланма', ru: 'Круг. движение' },
  speed_zone: { uzLatin: 'Tezlik', uz: 'Тезлик', ru: 'Скорость' },
};

const questionMap = new Map(animatedQuestions.map((q) => [q.id, q]));

export default function AnimatedTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLocale();
  const locale = language as Locale;
  const t = (obj: { uzLatin: string; uz: string; ru: string }) => obj[locale] ?? obj.uzLatin;

  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get<SessionDetail>(`/animated-sessions/${id}`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div
        className="-m-4 md:-m-6 min-h-[calc(100vh-4rem)] rounded-none flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)' }}
      >
        <p className="text-white/40">{t(texts.loading)}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div
        className="-m-4 md:-m-6 min-h-[calc(100vh-4rem)] rounded-none flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)' }}
      >
        <p className="text-white/40">{t(texts.notFound)}</p>
        <Link href="/animated-test/history" className="text-sm text-blue-400 hover:underline">
          {t(texts.back)}
        </Link>
      </div>
    );
  }

  const wrongCount = detail.totalQuestions - detail.correctCount;
  const percentage = detail.scorePercentage;

  function getEmoji(pct: number): string {
    if (pct >= 90) return '\u{1F3C6}';
    if (pct >= 70) return '\u2705';
    if (pct >= 50) return '\u26A0\uFE0F';
    return '\u274C';
  }

  return (
    <div
      className="-m-4 md:-m-6 min-h-[calc(100vh-4rem)] rounded-none"
      style={{ background: 'linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)' }}
    >
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/animated-test/history"
            className="flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(texts.back)}
          </Link>
        </div>

        {/* Score card */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 text-center">
          <span className="text-4xl">{getEmoji(percentage)}</span>
          <div className="mt-2 text-4xl font-extrabold text-white tabular-nums sm:text-5xl">
            {percentage}%
          </div>
          <div className="mt-4 flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-white/60">
                {t(texts.correct)}: <span className="font-bold text-white/90">{detail.correctCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
              <span className="text-white/60">
                {t(texts.wrong)}: <span className="font-bold text-white/90">{wrongCount}</span>
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/30">
            <Clock className="h-3.5 w-3.5" />
            {t(texts.time)}: {formatTime(detail.timeTakenSeconds)}
          </div>
        </div>

        {/* Question list */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
            {t(texts.questions)}
          </h3>
          <div className="flex flex-col gap-2">
            {detail.answers.map((answer, i) => {
              const question = questionMap.get(answer.questionId);
              const correctOption = question?.options.find((o) => o.correct);

              return (
                <div
                  key={answer.questionId}
                  className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                      answer.isCorrect ? 'bg-emerald-500/80' : 'bg-red-500/80'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 leading-relaxed">
                        {question?.question[locale] ?? answer.questionId}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-white/40">
                          {categoryNames[answer.category]?.[locale] ?? answer.category}
                        </span>
                        <span className="text-white/25">
                          {(answer.timeSpentMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                      {!answer.isCorrect && question && (
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="text-red-400/70">
                            {t(texts.yourAnswer)}: {question.options.find((o) => o.id === answer.selectedOptionId)?.text[locale] ?? '—'}
                          </p>
                          <p className="text-emerald-400/70">
                            {t(texts.correctAnswer)}: {correctOption?.text[locale] ?? '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back to test */}
        <div className="mt-6 text-center">
          <Link
            href="/animated-test"
            className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
          >
            {locale === 'ru' ? 'Пройти снова' : locale === 'uz' ? 'Қайта уриниш' : 'Qayta urinish'}
          </Link>
        </div>
      </div>
    </div>
  );
}
