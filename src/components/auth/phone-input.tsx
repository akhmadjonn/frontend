'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function PhoneInput({ value, onChange, disabled, error }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Display as: XX XXX XX XX (9 digits after 998)
  const formatDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '').replace(/^998/, '').slice(0, 9);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 7));
    if (digits.length > 7) parts.push(digits.slice(7, 9));
    return parts.join(' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const suffix = raw.replace(/^998/, '').slice(0, 9);
    onChange('998' + suffix);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const suffix = value.replace(/^998/, '');
      if (suffix.length > 0) {
        onChange('998' + suffix.slice(0, -1));
        e.preventDefault();
      }
    }
  };

  return (
    <div
      className={cn(
        'flex h-10 w-full items-center rounded-lg border bg-background px-3 py-2 text-sm transition-colors',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        error ? 'border-destructive' : 'border-input',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="mr-2 select-none text-muted-foreground shrink-0">+998</span>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        value={formatDisplay(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="XX XXX XX XX"
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        maxLength={12}
      />
    </div>
  );
}
