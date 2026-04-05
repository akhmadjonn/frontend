'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AnimatedQuestion, Locale, QuizPhase } from '../types';
import { shuffleArray } from '../utils/animation';
import { apiClient } from '@/lib/api-client';
import QuizSetup from './QuizSetup';
import SceneRenderer from './SceneRenderer';
import QuestionCard from './QuestionCard';
import ResultCard from './ResultCard';
import ScoreSummary from './ScoreSummary';
import ProgressBar from './ProgressBar';
import LanguageSwitcher from './LanguageSwitcher';

interface AnimatedQuizProps {
  questions: AnimatedQuestion[];
}

const pageTitle = {
  uzLatin: "Animatsiyali test",
  uz: "Анимацияли тест",
  ru: "Анимированный тест",
} as const;

const pageSubtitle = {
  uzLatin: "Javobingiz natijasini animatsiya orqali ko'ring",
  uz: "Жавобингиз натижасини анимация орқали кўринг",
  ru: "Увидьте последствия вашего выбора",
} as const;

export default function AnimatedQuiz({ questions }: AnimatedQuizProps) {
  const [locale, setLocale] = useState<Locale>('uzLatin');
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [selectedQuestions, setSelectedQuestions] = useState<AnimatedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerDetails, setAnswerDetails] = useState<Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    category: string;
    timeSpentMs: number;
    answeredAt: string;
  }>>([]);
  const questionStartTime = useRef<number>(Date.now());
  const sessionStartTime = useRef<string>(new Date().toISOString());

  const handleStart = useCallback((count: number) => {
    const shuffled = shuffleArray(questions);
    const picked = shuffled.slice(0, Math.min(count, questions.length));
    setSelectedQuestions(picked);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setAnswerDetails([]);
    sessionStartTime.current = new Date().toISOString();
    questionStartTime.current = Date.now();
    setPhase('question');
  }, [questions]);

  const currentQuestion = selectedQuestions[currentIndex];
  const isLastQuestion = currentIndex === selectedQuestions.length - 1;

  const handleSelectOption = useCallback((optionId: string) => {
    if (phase !== 'question' || !currentQuestion) return;
    const timeSpentMs = Date.now() - questionStartTime.current;
    const correctId = currentQuestion.options.find((o) => o.correct)?.id;
    const isCorrect = optionId === correctId;

    setAnswerDetails((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        isCorrect,
        category: currentQuestion.category,
        timeSpentMs,
        answeredAt: new Date().toISOString(),
      },
    ]);

    setSelectedOption(optionId);
    setPhase('animating');
  }, [phase, currentQuestion]);

  const handleAnimationComplete = useCallback(() => {
    if (!selectedOption || !currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedOption }));
    setPhase('result');
  }, [selectedOption, currentQuestion]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setPhase('summary');
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    questionStartTime.current = Date.now();
    setPhase('question');
  }, [isLastQuestion]);

  // Fire-and-forget: submit session to backend when quiz completes
  useEffect(() => {
    if (phase !== 'summary' || answerDetails.length === 0) return;

    const correctCount = answerDetails.filter((a) => a.isCorrect).length;
    const totalQuestions = answerDetails.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    const payload = {
      startedAt: sessionStartTime.current,
      completedAt: new Date().toISOString(),
      totalQuestions,
      correctCount,
      scorePercentage,
      answers: answerDetails,
    };

    apiClient.post('/animated-sessions', payload).catch((err) => {
      console.warn('Failed to save animated test session, storing for retry:', err);
      try {
        const pending = JSON.parse(localStorage.getItem('pendingAnimatedSessions') ?? '[]');
        pending.push(payload);
        localStorage.setItem('pendingAnimatedSessions', JSON.stringify(pending));
      } catch { /* ignore storage errors */ }
    });
  }, [phase, answerDetails]);

  // Retry pending sessions on mount
  useEffect(() => {
    try {
      const pending = JSON.parse(localStorage.getItem('pendingAnimatedSessions') ?? '[]');
      if (pending.length === 0) return;

      localStorage.removeItem('pendingAnimatedSessions');
      const failed: unknown[] = [];

      for (const session of pending) {
        apiClient.post('/animated-sessions', session).catch(() => {
          failed.push(session);
          if (failed.length > 0)
            localStorage.setItem('pendingAnimatedSessions', JSON.stringify(failed));
        });
      }
    } catch { /* ignore */ }
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('setup');
    setSelectedQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setAnswerDetails([]);
  }, []);

  // Setup screen
  if (phase === 'setup') {
    return (
      <QuizSetup
        questions={questions}
        locale={locale}
        onLocaleChange={setLocale}
        onStart={handleStart}
      />
    );
  }

  const scenePhase = phase === 'animating' ? 'animating' : phase === 'result' ? 'done' : 'idle';

  // Summary screen
  if (phase === 'summary') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white/90 sm:text-2xl">
            {pageTitle[locale]}
          </h1>
          <LanguageSwitcher locale={locale} onLocaleChange={setLocale} />
        </div>
        <ScoreSummary
          questions={selectedQuestions}
          answers={answers}
          locale={locale}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90 sm:text-2xl">
            {pageTitle[locale]}
          </h1>
          <p className="mt-0.5 text-sm text-white/40">
            {pageSubtitle[locale]}
          </p>
        </div>
        <LanguageSwitcher locale={locale} onLocaleChange={setLocale} />
      </div>

      {/* Progress */}
      <div className="mb-5">
        <ProgressBar
          current={currentIndex}
          total={selectedQuestions.length}
          answers={answers}
          questions={selectedQuestions}
          locale={locale}
        />
      </div>

      {/* Scene */}
      <div className="mb-5">
        <SceneRenderer
          scene={currentQuestion.scene}
          outcomes={currentQuestion.outcomes}
          selectedOption={selectedOption}
          phase={scenePhase}
          onAnimationComplete={handleAnimationComplete}
          locale={locale}
        />
      </div>

      {/* Question + Options */}
      <div className="mb-5">
        <QuestionCard
          question={currentQuestion}
          locale={locale}
          selectedOption={selectedOption}
          phase={phase}
          onSelectOption={handleSelectOption}
        />
      </div>

      {/* Result */}
      {phase === 'result' && selectedOption && (
        <ResultCard
          question={currentQuestion}
          selectedOptionId={selectedOption}
          locale={locale}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
