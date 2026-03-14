'use client';

import { useState, useEffect } from 'react';

function calcSecondsLeft(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(() => calcSecondsLeft(expiresAt));
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => setSecondsLeft(calcSecondsLeft(expiresAt));

    updateTimer();
    setInitialized(true);
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft > 0 && secondsLeft < 60;
  const isExpired = initialized && expiresAt !== null && secondsLeft === 0;

  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { secondsLeft, minutes, seconds, formatted, isUrgent, isExpired };
}
