'use client';

import { useCountdown } from '@/hooks/use-countdown';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}

export default function ExamTimer({ expiresAt, onExpire, className }: ExamTimerProps) {
  const { formatted, isUrgent, isExpired } = useCountdown(expiresAt);

  if (isExpired) onExpire?.();

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold transition-colors',
        isUrgent ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-foreground',
        className
      )}
      aria-label={`Qolgan vaqt: ${formatted}`}
    >
      <Clock className={cn('h-4 w-4', isUrgent && 'animate-pulse')} />
      {formatted}
    </div>
  );
}
