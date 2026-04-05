'use client';

import type { Locale } from '../types';

const localeOptions: { value: Locale; label: string; short: string }[] = [
  { value: 'uzLatin', label: "O'zbekcha", short: 'UZ' },
  { value: 'uz', label: 'Ўзбекча', short: 'ЎЗ' },
  { value: 'ru', label: 'Русский', short: 'РУ' },
];

interface LanguageSwitcherProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export default function LanguageSwitcher({ locale, onLocaleChange }: LanguageSwitcherProps) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-0.5">
      {localeOptions.map((option) => {
        const isActive = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onLocaleChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm ${
              isActive
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.short}</span>
          </button>
        );
      })}
    </div>
  );
}
