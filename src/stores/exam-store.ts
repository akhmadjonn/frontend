import { create } from 'zustand';

type ExamMode = 'exam' | 'ticket' | 'marathon' | 'speedChallenge';

type LocalizedText = { uz: string; uzLatin: string; ru: string };

interface ExamQuestion {
  id: string;
  questionId: string;
  order: number;
  text: LocalizedText;
  imageUrl: string | null;
  answerOptions: Array<{
    id: string;
    text: LocalizedText;
    imageUrl: string | null;
  }>;
  selectedAnswerId?: string | null;
  correctAnswerId?: string | null;
  isCorrect?: boolean | null;
  explanation?: LocalizedText | null;
}

interface ExamFeedback {
  isCorrect: boolean;
  correctAnswerId: string;
  explanation: LocalizedText | null;
}

interface ExamState {
  examId: string | null;
  questions: ExamQuestion[];
  totalQuestions: number;
  currentIndex: number;
  answers: Map<string, string>;
  feedback: Map<string, ExamFeedback>;
  expiresAt: string | null;
  status: 'idle' | 'inProgress' | 'completed' | 'expired';
  tabSwitchCount: number;
  mode: ExamMode;

  startExam: (
    examId: string,
    questions: ExamQuestion[],
    expiresAt: string | null,
    mode: ExamMode,
    totalQuestions?: number,
    existingAnswers?: Map<string, string>,
    existingFeedback?: Map<string, ExamFeedback>,
  ) => void;
  selectAnswer: (sessionQuestionId: string, answerId: string) => void;
  setFeedback: (sessionQuestionId: string, feedback: ExamFeedback) => void;
  appendQuestions: (questions: ExamQuestion[]) => void;
  goToQuestion: (index: number) => void;
  incrementTabSwitch: () => void;
  submitExam: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'avtolider:exam-session';

interface SerializedExamState {
  examId: string | null;
  questions: ExamQuestion[];
  totalQuestions: number;
  currentIndex: number;
  answers: Array<[string, string]>;
  feedback: Array<[string, ExamFeedback]>;
  expiresAt: string | null;
  status: ExamState['status'];
  tabSwitchCount: number;
  mode: ExamMode;
}

function saveToSession(state: Partial<ExamState>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: SerializedExamState = {
      examId: state.examId ?? null,
      questions: state.questions ?? [],
      totalQuestions: state.totalQuestions ?? (state.questions?.length ?? 0),
      currentIndex: state.currentIndex ?? 0,
      answers: state.answers ? Array.from(state.answers.entries()) : [],
      feedback: state.feedback ? Array.from(state.feedback.entries()) : [],
      expiresAt: state.expiresAt ?? null,
      status: state.status ?? 'idle',
      tabSwitchCount: state.tabSwitchCount ?? 0,
      mode: state.mode ?? 'exam',
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[exam-store] Failed to save to sessionStorage (quota exceeded?):', e);
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSaveToSession(state: Partial<ExamState>) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveToSession(state), 300);
}

function loadFromSession(): Partial<ExamState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SerializedExamState>;
    if (parsed.status !== 'inProgress') return null;
    return {
      examId: parsed.examId ?? null,
      questions: parsed.questions ?? [],
      totalQuestions: parsed.totalQuestions ?? (parsed.questions?.length ?? 0),
      currentIndex: parsed.currentIndex ?? 0,
      answers: new Map(parsed.answers ?? []),
      feedback: new Map(parsed.feedback ?? []),
      expiresAt: parsed.expiresAt ?? null,
      status: parsed.status,
      tabSwitchCount: parsed.tabSwitchCount ?? 0,
      mode: parsed.mode ?? 'exam',
    };
  } catch {
    return null;
  }
}

function clearSession() {
  if (typeof window === 'undefined') return;
  if (saveTimeout) clearTimeout(saveTimeout);
  sessionStorage.removeItem(STORAGE_KEY);
}

const restored = loadFromSession();

export const useExamStore = create<ExamState>((set, get) => ({
  examId: restored?.examId ?? null,
  questions: restored?.questions ?? [],
  totalQuestions: restored?.totalQuestions ?? 0,
  currentIndex: restored?.currentIndex ?? 0,
  answers: restored?.answers ?? new Map(),
  feedback: restored?.feedback ?? new Map(),
  expiresAt: restored?.expiresAt ?? null,
  status: restored?.status ?? 'idle',
  tabSwitchCount: restored?.tabSwitchCount ?? 0,
  mode: restored?.mode ?? 'exam',

  startExam: (examId, questions, expiresAt, mode, totalQuestions, existingAnswers, existingFeedback) => {
    // Hydrate verdict state from server-supplied question fields (resume + start both
    // include past-answer reveal data when applicable). Caller may also pass explicit
    // maps — those win over per-question fields.
    const hydratedAnswers = existingAnswers ?? new Map<string, string>();
    const hydratedFeedback = existingFeedback ?? new Map<string, ExamFeedback>();
    if (!existingAnswers || !existingFeedback) {
      for (const q of questions) {
        if (!existingAnswers && q.selectedAnswerId)
          hydratedAnswers.set(q.id, q.selectedAnswerId);
        if (!existingFeedback && q.selectedAnswerId && q.correctAnswerId && q.isCorrect != null) {
          hydratedFeedback.set(q.id, {
            isCorrect: q.isCorrect,
            correctAnswerId: q.correctAnswerId,
            explanation: q.explanation ?? null,
          });
        }
      }
    }

    const newState: Partial<ExamState> = {
      examId,
      questions,
      totalQuestions: totalQuestions ?? questions.length,
      expiresAt,
      mode,
      status: 'inProgress',
      currentIndex: 0,
      answers: hydratedAnswers,
      feedback: hydratedFeedback,
      tabSwitchCount: 0,
    };
    set(newState);
    saveToSession(newState);
  },

  selectAnswer: (sessionQuestionId, answerId) =>
    set((state) => {
      // Lock-first-answer mirror: ignore any attempt to overwrite an existing pick.
      // Server enforces the same rule authoritatively; this just keeps the UI honest.
      if (state.answers.has(sessionQuestionId)) return state;
      const newAnswers = new Map(state.answers);
      newAnswers.set(sessionQuestionId, answerId);
      debouncedSaveToSession({ ...state, answers: newAnswers });
      return { answers: newAnswers };
    }),

  setFeedback: (sessionQuestionId, fb) =>
    set((state) => {
      if (state.feedback.has(sessionQuestionId)) return state;
      const newFeedback = new Map(state.feedback);
      newFeedback.set(sessionQuestionId, fb);
      debouncedSaveToSession({ ...state, feedback: newFeedback });
      return { feedback: newFeedback };
    }),

  appendQuestions: (incoming) =>
    set((state) => {
      const known = new Set(state.questions.map((q) => q.id));
      const additions = incoming.filter((q) => !known.has(q.id));
      if (additions.length === 0) return state;

      const merged = [...state.questions, ...additions].sort((a, b) => a.order - b.order);

      // Hydrate verdict state from any newly-loaded questions that the user already answered
      // (resume into the middle of a marafon picks up past verdicts for revisits).
      const newAnswers = new Map(state.answers);
      const newFeedback = new Map(state.feedback);
      for (const q of additions) {
        if (q.selectedAnswerId && !newAnswers.has(q.id))
          newAnswers.set(q.id, q.selectedAnswerId);
        if (q.selectedAnswerId && q.correctAnswerId && q.isCorrect != null && !newFeedback.has(q.id)) {
          newFeedback.set(q.id, {
            isCorrect: q.isCorrect,
            correctAnswerId: q.correctAnswerId,
            explanation: q.explanation ?? null,
          });
        }
      }

      const next = { questions: merged, answers: newAnswers, feedback: newFeedback };
      debouncedSaveToSession({ ...state, ...next });
      return next;
    }),

  goToQuestion: (index) => {
    set({ currentIndex: index });
    debouncedSaveToSession({ ...get(), currentIndex: index });
  },

  incrementTabSwitch: () =>
    set((state) => {
      const count = state.tabSwitchCount + 1;
      debouncedSaveToSession({ ...state, tabSwitchCount: count });
      return { tabSwitchCount: count };
    }),

  submitExam: () => {
    set({ status: 'completed' });
    clearSession();
  },

  reset: () => {
    clearSession();
    set({
      examId: null,
      questions: [],
      totalQuestions: 0,
      currentIndex: 0,
      answers: new Map(),
      feedback: new Map(),
      expiresAt: null,
      status: 'idle',
      tabSwitchCount: 0,
      mode: 'exam',
    });
  },
}));
