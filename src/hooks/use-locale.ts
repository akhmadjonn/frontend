'use client';

import { useLocaleStore } from '@/stores/locale-store';
import uzLatinDict from '@/i18n/uz-latin.json';
import uzCyrillicDict from '@/i18n/uz-cyrillic.json';
import ruDict from '@/i18n/ru.json';

type LocalizedText = { uz: string; uzLatin: string; ru: string } | null | undefined;

const VALID_LOCALES = new Set(['uzLatin', 'uz', 'ru'] as const);

const dictionaries: Record<string, Record<string, unknown>> = {
  uzLatin: uzLatinDict,
  uz: uzCyrillicDict,
  ru: ruDict,
};

// Blocked property names to prevent prototype pollution
const BLOCKED_KEYS = new Set([
  '__proto__', 'constructor', 'prototype', 'toString', 'valueOf',
  'hasOwnProperty', 'isPrototypeOf', 'toLocaleString',
]);

// Validate translation key format: only alphanumeric, dots, and camelCase
const VALID_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/;

export function useLocale() {
  const { language, setLanguage } = useLocaleStore();

  const safeLanguage = VALID_LOCALES.has(language as 'uzLatin' | 'uz' | 'ru')
    ? language
    : 'uzLatin';

  const t = (text: LocalizedText): string => {
    if (!text) return '';
    switch (safeLanguage) {
      case 'uz': return text.uz;
      case 'uzLatin': return text.uzLatin;
      case 'ru': return text.ru;
      default: return text.uzLatin;
    }
  };

  const ts = (key: string): string => {
    if (!VALID_KEY_PATTERN.test(key)) return key;

    const dict = dictionaries[safeLanguage] ?? dictionaries.uzLatin;
    const parts = key.split('.');
    let result: unknown = dict;

    for (const part of parts) {
      if (BLOCKED_KEYS.has(part)) return key;
      if (result && typeof result === 'object' && Object.hasOwn(result as object, part))
        result = (result as Record<string, unknown>)[part];
      else
        return key;
    }

    return typeof result === 'string' ? result : key;
  };

  return { language: safeLanguage, setLanguage, t, ts };
}
