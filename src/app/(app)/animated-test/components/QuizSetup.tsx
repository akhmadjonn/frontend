'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AnimatedQuestion, Locale, LocalizedText } from '../types';
import LanguageSwitcher from './LanguageSwitcher';

const title: LocalizedText = {
  uzLatin: "Animatsiyali test",
  uz: "Анимацияли тест",
  ru: "Анимированный тест",
};

const subtitle: LocalizedText = {
  uzLatin: "Haydovchilik imtihoniga tayyorlaning — animatsiya orqali o'rganing",
  uz: "Ҳайдовчилик имтиҳонига тайёрланинг — анимация орқали ўрганинг",
  ru: "Подготовьтесь к экзамену — учитесь через анимации",
};

const questionCountLabel: LocalizedText = {
  uzLatin: "Savollar soni",
  uz: "Саволлар сони",
  ru: "Количество вопросов",
};

const startText: LocalizedText = {
  uzLatin: "Testni boshlash",
  uz: "Тестни бошлаш",
  ru: "Начать тест",
};

const totalQuestionsLabel: LocalizedText = {
  uzLatin: "Jami savollar bazasi",
  uz: "Жами саволлар базаси",
  ru: "Всего вопросов в базе",
};

const categoriesLabel: LocalizedText = {
  uzLatin: "Mavzular",
  uz: "Мавзулар",
  ru: "Темы",
};

const categoryNames: Record<string, LocalizedText> = {
  railway: { uzLatin: "Temir yo'l", uz: 'Темир йўл', ru: 'Ж/Д переезд' },
  intersection: { uzLatin: 'Chorrahа', uz: 'Чорраҳа', ru: 'Перекрёсток' },
  pedestrian: { uzLatin: "Piyodalar", uz: 'Пиёдалар', ru: 'Пешеходы' },
  overtake: { uzLatin: "Qo'shib o'tish", uz: 'Қўшиб ўтиш', ru: 'Обгон' },
  traffic_light: { uzLatin: 'Svetofor', uz: 'Светофор', ru: 'Светофор' },
  roundabout: { uzLatin: 'Aylanma', uz: 'Айланма', ru: 'Круг. движение' },
  speed_zone: { uzLatin: 'Tezlik', uz: 'Тезлик', ru: 'Скорость' },
};

const categoryIcons: Record<string, string> = {
  railway: '🚂', intersection: '🔀', pedestrian: '🚶', overtake: '🚗',
  traffic_light: '🚦', roundabout: '🔄', speed_zone: '⚡',
};

const QUESTION_OPTIONS = [5, 10, 15, 20];

interface QuizSetupProps {
  questions: AnimatedQuestion[];
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onStart: (count: number) => void;
}

export default function QuizSetup({ questions, locale, onLocaleChange, onStart }: QuizSetupProps) {
  const [selectedCount, setSelectedCount] = useState(10);

  const categoryMap = new Map<string, number>();
  for (const q of questions) {
    categoryMap.set(q.category, (categoryMap.get(q.category) ?? 0) + 1);
  }

  const maxCount = Math.min(questions.length, 20);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-14">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-blue-500/10 p-4 ring-1 ring-blue-500/20">
          <svg className="h-10 w-10 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title[locale]}</h1>
        <p className="mt-2 text-sm text-white/40 leading-relaxed">{subtitle[locale]}</p>
      </div>

      {/* Language switcher */}
      <div className="mb-8 flex justify-center">
        <LanguageSwitcher locale={locale} onLocaleChange={onLocaleChange} />
      </div>

      {/* Question count selector */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/70">{questionCountLabel[locale]}</h3>
        <div className="grid grid-cols-4 gap-2">
          {QUESTION_OPTIONS.filter(n => n <= maxCount).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setSelectedCount(count)}
              className={`rounded-xl py-3 text-lg font-bold transition-all duration-200 ${
                selectedCount === count
                  ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'bg-white/[0.03] text-white/40 ring-1 ring-white/5 hover:bg-white/[0.06] hover:text-white/60'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Categories overview */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">{categoriesLabel[locale]}</h3>
          <span className="text-xs text-white/30">
            {totalQuestionsLabel[locale]}: <span className="font-bold text-white/60">{questions.length}</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from(categoryMap.entries()).map(([cat, count]) => (
            <div
              key={cat}
              className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5"
            >
              <span className="text-base">{categoryIcons[cat] ?? '📋'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/60 truncate">
                  {categoryNames[cat]?.[locale] ?? cat}
                </div>
              </div>
              <span className="text-xs font-bold text-white/40 tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        type="button"
        onClick={() => onStart(selectedCount)}
        className="w-full rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] shadow-lg"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
      >
        {startText[locale]} ({selectedCount} {locale === 'ru' ? 'вопросов' : 'savol'})
      </button>

      {/* History link */}
      <Link
        href="/animated-test/history"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70"
      >
        {locale === 'ru' ? 'История тестов' : locale === 'uz' ? 'Тестлар тарихи' : 'Testlar tarixi'}
      </Link>

      {/* Footer note */}
      <p className="mt-4 text-center text-xs text-white/20">
        {locale === 'ru'
          ? 'Вопросы выбираются случайным образом из базы'
          : locale === 'uz'
            ? 'Саволлар базадан тасодифий танланади'
            : "Savollar bazadan tasodifiy tanlanadi"}
      </p>
    </div>
  );
}
