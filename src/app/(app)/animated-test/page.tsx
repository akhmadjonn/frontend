'use client';

import AnimatedQuiz from './components/AnimatedQuiz';
import { animatedQuestions } from './data/questions';

export default function AnimatedTestPage() {
  return (
    <div
      className="-m-4 md:-m-6 min-h-[calc(100vh-4rem)] rounded-none"
      style={{
        background: 'linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)',
      }}
    >
      <AnimatedQuiz questions={animatedQuestions} />
    </div>
  );
}
