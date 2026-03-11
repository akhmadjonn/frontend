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

  startExam: (examId: string, questions: ExamQuestion[], expiresAt: string | null, mode: ExamMode) => void;
  selectAnswer: (questionId: string, answerId: string) => void;
  goToQuestion: (index: number) => void;
  incrementTabSwitch: () => void;
  submitExam: () => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  examId: null,
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  expiresAt: null,
  status: 'idle',
  tabSwitchCount: 0,
  mode: 'exam',

  startExam: (examId, questions, expiresAt, mode) =>
    set({ examId, questions, expiresAt, mode, status: 'inProgress', currentIndex: 0, answers: new Map(), tabSwitchCount: 0 }),

  selectAnswer: (questionId, answerId) =>
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answerId);
      return { answers: newAnswers };
    }),

  goToQuestion: (index) => set({ currentIndex: index }),
  incrementTabSwitch: () => set((state) => ({ tabSwitchCount: state.tabSwitchCount + 1 })),
  submitExam: () => set({ status: 'completed' }),
  reset: () => set({ examId: null, questions: [], currentIndex: 0, answers: new Map(), expiresAt: null, status: 'idle', tabSwitchCount: 0, mode: 'exam' }),
}));
