import { create } from 'zustand';

interface PracticeQuestion {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  categoryName: { uz: string; uzLatin: string; ru: string };
  difficulty: number;
  answerOptions: Array<{
    id: string;
    text: { uz: string; uzLatin: string; ru: string };
    imageUrl: string | null;
  }>;
  leitnerBox: number;
}

interface PracticeAnswer {
  questionId: string;
  selectedAnswerId: string;
  isCorrect: boolean;
  correctAnswerId: string;
}

interface PracticeState {
  questions: PracticeQuestion[];
  currentIndex: number;
  answers: PracticeAnswer[];
  batchComplete: boolean;

  setQuestions: (questions: PracticeQuestion[]) => void;
  addAnswer: (answer: PracticeAnswer) => void;
  nextQuestion: () => void;
  completeBatch: () => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  questions: [],
  currentIndex: 0,
  answers: [],
  batchComplete: false,

  setQuestions: (questions) => set({ questions, currentIndex: 0, answers: [], batchComplete: false }),
  addAnswer: (answer) => set((state) => ({ answers: [...state.answers, answer] })),
  nextQuestion: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),
  completeBatch: () => set({ batchComplete: true }),
  reset: () => set({ questions: [], currentIndex: 0, answers: [], batchComplete: false }),
}));
