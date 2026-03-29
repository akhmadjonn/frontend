import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export interface DashboardData {
  totalQuestionsPracticed: number;
  totalExamsTaken: number;
  averageExamScore: number;
  currentStreak: number;
  dueForReview: number;
  questionsAnsweredToday: number;
  examPassRate: number;
  recentExams: Array<{ examId: string; mode: string; score: number; passed: boolean; completedAt: string }>;
  accuracyOverTime: Array<{ date: string; accuracy: number; questionCount?: number }>;
}

export interface CategoryData {
  categoryId: string;
  categoryName: { uz: string; uzLatin: string; ru: string };
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  questionsInCategory: number;
  questionsPracticed: number;
}

interface DashboardState {
  dashboard: DashboardData | null;
  categories: CategoryData[] | null;
  lastFetched: number | null;
  loading: boolean;
  error: boolean;
  fetch: (force?: boolean) => Promise<void>;
  invalidate: () => void;
}

const STALE_MS = 10_000; // 10s — refetch in background if older

// Dedup: prevent concurrent fetch calls from firing duplicate API requests
let inflightPromise: Promise<void> | null = null;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboard: null,
  categories: null,
  lastFetched: null,
  loading: true,
  error: false,

  fetch: async (force = false) => {
    const state = get();
    const now = Date.now();
    const hasData = state.dashboard !== null;
    const isStale = !state.lastFetched || (now - state.lastFetched) > STALE_MS;

    // Fresh data exists — skip
    if (hasData && !isStale && !force) {
      if (state.loading) set({ loading: false });
      return;
    }

    // Dedup: if a fetch is already in-flight, reuse it (unless forced)
    if (inflightPromise && !force) return inflightPromise;

    // Stale data exists — show cached, refetch in background (no loading skeleton)
    if (hasData && !force)
      set({ loading: false });
    else
      set({ loading: true });

    inflightPromise = (async () => {
      try {
        const [dash, cats] = await Promise.all([
          apiClient.get<DashboardData>('/progress/dashboard'),
          apiClient.get<CategoryData[]>('/progress/categories'),
        ]);
        set({ dashboard: dash, categories: cats, lastFetched: Date.now(), loading: false, error: false });
      } catch {
        // Keep stale data if available, only show error on first load
        if (!get().dashboard) set({ error: true });
        set({ loading: false });
      } finally {
        inflightPromise = null;
      }
    })();

    return inflightPromise;
  },

  invalidate: () => set({ lastFetched: null }),
}));
