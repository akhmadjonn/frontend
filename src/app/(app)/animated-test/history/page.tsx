'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, ChevronLeft, History, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

interface AnimatedSessionItem {
  sessionId: string;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
  timeTakenSeconds: number;
}

interface AnimatedStats {
  totalSessions: number;
  avgScore: number;
  bestScore: number;
  categoryStats: Record<string, { total: number; correct: number; accuracy: number }>;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const texts = {
  title: { uzLatin: 'Animatsiyali test tarixi', uz: 'Анимацияли тест тарихи', ru: 'История анимированных тестов' },
  back: { uzLatin: 'Testga qaytish', uz: 'Тестга қайтиш', ru: 'Вернуться к тесту' },
  noHistory: { uzLatin: 'Hali test topshirilmagan', uz: 'Ҳали тест топширилмаган', ru: 'Тесты ещё не пройдены' },
  startTest: { uzLatin: 'Testni boshlash', uz: 'Тестни бошлаш', ru: 'Начать тест' },
  totalSessions: { uzLatin: 'Jami testlar', uz: 'Жами тестлар', ru: 'Всего тестов' },
  avgScore: { uzLatin: "O'rtacha ball", uz: 'Ўртача балл', ru: 'Средний балл' },
  bestScore: { uzLatin: 'Eng yaxshi', uz: 'Энг яхши', ru: 'Лучший' },
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

export default function AnimatedTestHistoryPage() {
  const { language } = useLocale();
  const locale = language as 'uz' | 'uzLatin' | 'ru';
  const t = (obj: { uzLatin: string; uz: string; ru: string }) => obj[locale] ?? obj.uzLatin;

  const [items, setItems] = useState<AnimatedSessionItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<AnimatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '10' });
      const data = await apiClient.get<{ items: AnimatedSessionItem[]; meta: PaginationMeta }>(
        `/animated-sessions?${params}`
      );
      setItems(data.items ?? []);
      setMeta(data.meta ?? null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.get<AnimatedStats>('/animated-sessions/stats');
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="-m-4 md:-m-6 min-h-[calc(100vh-4rem)] rounded-none"
      style={{ background: 'linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)' }}
    >
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white/90 sm:text-2xl">{t(texts.title)}</h1>
          <Link
            href="/animated-test"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.08]"
          >
            {t(texts.back)}
          </Link>
        </div>

        {/* Stats cards */}
        {stats && stats.totalSessions > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-2xl font-bold text-white tabular-nums">{stats.totalSessions}</div>
              <div className="mt-1 text-xs text-white/40">{t(texts.totalSessions)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 tabular-nums">{stats.avgScore}%</div>
              <div className="mt-1 text-xs text-white/40">{t(texts.avgScore)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">{stats.bestScore}%</div>
              <div className="mt-1 text-xs text-white/40">{t(texts.bestScore)}</div>
            </div>
          </div>
        )}

        {/* Category accuracy */}
        {stats && Object.keys(stats.categoryStats).length > 0 && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-white/40" />
              <span className="text-xs font-semibold text-white/50">
                {locale === 'ru' ? 'Точность по категориям' : locale === 'uz' ? 'Категория бўйича аниқлик' : 'Kategoriya bo\'yicha aniqlik'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.categoryStats).map(([cat, s]) => (
                <div key={cat} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
                  <span className="text-xs text-white/60 truncate">
                    {categoryNames[cat]?.[locale] ?? cat}
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${
                    s.accuracy >= 80 ? 'text-emerald-400' : s.accuracy >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {s.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session list */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04]">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.05]" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
                <History className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-sm text-white/40">{t(texts.noHistory)}</p>
              <Link
                href="/animated-test"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.08]"
              >
                {t(texts.startTest)}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5 p-2">
              {items.map((item) => {
                const passed = item.scorePercentage >= 70;
                return (
                  <Link
                    key={item.sessionId}
                    href={`/animated-test/history/${item.sessionId}`}
                    className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        passed ? 'bg-emerald-500/15' : 'bg-red-500/15'
                      }`}>
                        {passed
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          : <XCircle className="h-4 w-4 text-red-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/80">
                          {item.correctCount}/{item.totalQuestions} ({item.scorePercentage}%)
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/30">
                          <span>{formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}</span>
                          {item.timeTakenSeconds > 0 && (
                            <>
                              <span>&middot;</span>
                              <span>{formatTime(item.timeTakenSeconds)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60 transition-colors hover:bg-white/[0.08] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-white/40 tabular-nums">
              {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60 transition-colors hover:bg-white/[0.08] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
