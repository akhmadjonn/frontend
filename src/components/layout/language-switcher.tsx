'use client';

import { useLocaleStore, useLocaleHydration } from '@/stores/locale-store';
import { cn } from '@/lib/utils';

const LANGS = [
  { key: 'uzLatin' as const, label: "O'z" },
  { key: 'uz' as const, label: 'Уз' },
  { key: 'ru' as const, label: 'Ру' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'default' | 'landing';
  className?: string;
}

export default function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  useLocaleHydration();
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);

  return (
    <div
      className={cn(
        'relative inline-flex items-center rounded-full p-0.5',
        variant === 'landing'
          ? 'bg-white/60 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-white/80'
          : 'bg-muted/50 backdrop-blur-sm border border-border/40',
        className
      )}
    >
      {LANGS.map((lang) => {
        const isActive = language === lang.key;
        return (
          <button
            key={lang.key}
            onClick={() => setLanguage(lang.key)}
            className={cn(
              'relative z-10 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-200',
              isActive
                ? 'bg-white text-foreground shadow-[0_1px_6px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/15 dark:text-white dark:shadow-[0_1px_6px_rgba(255,255,255,0.08)]'
                : 'text-muted-foreground/70 hover:text-foreground/80'
            )}
            aria-label={lang.key === 'uzLatin' ? "O'zbek (Lotin)" : lang.key === 'uz' ? "O'zbek (Кирилл)" : 'Русский'}
            aria-pressed={isActive}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
