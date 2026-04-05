'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export function useAnimation(duration: number, onComplete?: () => void) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    startTimeRef.current = performance.now();
    setPhase('running');
    setProgress(0);

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p >= 1) {
        rafRef.current = null;
        setPhase('done');
        onCompleteRef.current?.();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [duration, stop]);

  const reset = useCallback(() => {
    stop();
    setPhase('idle');
    setProgress(0);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { phase, progress, start, stop, reset };
}
