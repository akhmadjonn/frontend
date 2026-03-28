'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function OtpInput({ value, onChange, onComplete, disabled, error }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const update = (arr: string[]) => {
    const newVal = arr.join('');
    onChange(newVal);
    if (newVal.length === 6) onComplete?.(newVal);
  };

  const focusAt = (index: number) => {
    const target = inputRefs.current[Math.max(0, Math.min(5, index))];
    target?.focus();
  };

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const arr = [...digits];
    arr[index] = digit;
    update(arr);
    focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = [...digits];
      if (arr[index]) {
        arr[index] = '';
        update(arr);
      } else if (index > 0) {
        arr[index - 1] = '';
        update(arr);
        focusAt(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const arr = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    update(arr);
    focusAt(Math.min(pasted.length, 5));
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`OTP digit ${i + 1}`}
          className={cn(
            'h-12 w-10 rounded-lg border text-center text-lg font-semibold transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            error ? 'border-destructive' : 'border-input',
            digits[i] ? 'border-primary bg-primary/5' : 'bg-background',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        />
      ))}
    </div>
  );
}
