'use client';

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface SpeedTimerProps {
  seconds: number;
  questionKey: string;
  onExpire: () => void;
  className?: string;
}

export default memo(function SpeedTimer({ seconds, questionKey, onExpire, className }: SpeedTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset when question changes
  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [questionKey, seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          // Use timeout to avoid state update during render
          setTimeout(() => onExpireRef.current(), 0);
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  const isUrgent = remaining > 0 && remaining <= 5;
  const progress = seconds > 0 ? (remaining / seconds) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-linear',
            isUrgent ? 'bg-red-500' : remaining <= seconds * 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-sm font-bold tabular-nums transition-colors shrink-0',
          isUrgent
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        )}
      >
        <Zap className={cn('h-3.5 w-3.5', isUrgent && 'animate-pulse')} />
        {remaining}s
      </div>
    </div>
  );
});
