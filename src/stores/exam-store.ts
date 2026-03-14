import { create } from 'zustand';

type ExamMode = 'exam' | 'ticket' | 'marathon';

interface ExamQuestion {
  id: string;
  questionId: string;
  order: number;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  answerOptions: Array<{
    id: string;
    text: { uz: string; uzLatin: string; ru: string };
    imageUrl: string | null;
  }>;
}

interface ExamState {
  examId: string | null;
  questions: ExamQuestion[];
  currentIndex: number;
  answers: Map<string, string>;
  expiresAt: string | null;
  status: 'idle' | 'inProgress' | 'completed' | 'expired';
  tabSwitchCount: number;
  mode: ExamMode;

  startExam: (examId: string, questions: ExamQuestion[], expiresAt: string | null, mode: ExamMode, existingAnswers?: Map<string, string>) => void;
  selectAnswer: (questionId: string, answerId: string) => void;
  goToQuestion: (index: number) => void;
  incrementTabSwitch: () => void;
  submitExam: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'avtolider:exam-session';

function saveToSession(state: Partial<ExamState>) {
  if (typeof window === 'undefined') return;
  try {
    const serializable = {
      examId: state.examId,
      questions: state.questions,
      currentIndex: state.currentIndex,
      answers: state.answers ? Array.from(state.answers.entries()) : [],
      expiresAt: state.expiresAt,
      status: state.status,
      tabSwitchCount: state.tabSwitchCount,
      mode: state.mode,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch { /* quota exceeded — ignore */ }
}

function loadFromSession(): Partial<ExamState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.status !== 'inProgress') return null;
    return {
      examId: parsed.examId,
      questions: parsed.questions,
      currentIndex: parsed.currentIndex,
      answers: new Map(parsed.answers ?? []),
      expiresAt: parsed.expiresAt,
      status: parsed.status,
      tabSwitchCount: parsed.tabSwitchCount ?? 0,
      mode: parsed.mode,
    };
  } catch {
    return null;
  }
}

function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

// Restore state from sessionStorage on init (survives refresh)
const restored = loadFromSession();

export const useExamStore = create<ExamState>((set, get) => ({
  examId: restored?.examId ?? null,
  questions: restored?.questions ?? [],
  currentIndex: restored?.currentIndex ?? 0,
  answers: restored?.answers ?? new Map(),
  expiresAt: restored?.expiresAt ?? null,
  status: restored?.status ?? 'idle',
  tabSwitchCount: restored?.tabSwitchCount ?? 0,
  mode: restored?.mode ?? 'exam',

  startExam: (examId, questions, expiresAt, mode, existingAnswers) => {
    const newState = { examId, questions, expiresAt, mode, status: 'inProgress' as const, currentIndex: 0, answers: existingAnswers ?? new Map<string, string>(), tabSwitchCount: 0 };
    set(newState);
    saveToSession(newState);
  },

  selectAnswer: (questionId, answerId) =>
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answerId);
      const newState = { ...state, answers: newAnswers };
      saveToSession(newState);
      return { answers: newAnswers };
    }),

  goToQuestion: (index) => {
    set({ currentIndex: index });
    saveToSession({ ...get(), currentIndex: index });
  },

  incrementTabSwitch: () =>
    set((state) => {
      const count = state.tabSwitchCount + 1;
      saveToSession({ ...state, tabSwitchCount: count });
      return { tabSwitchCount: count };
    }),

  submitExam: () => {
    set({ status: 'completed' });
    clearSession();
  },

  reset: () => {
    clearSession();
    set({ examId: null, questions: [], currentIndex: 0, answers: new Map(), expiresAt: null, status: 'idle', tabSwitchCount: 0, mode: 'exam' });
  },
}));
