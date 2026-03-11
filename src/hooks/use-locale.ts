'use client';

import { useLocaleStore } from '@/stores/locale-store';

type LocalizedText = { uz: string; uzLatin: string; ru: string } | null | undefined;

export function useLocale() {
  const { language, setLanguage } = useLocaleStore();

  const t = (text: LocalizedText): string => {
    if (!text) return '';
    switch (language) {
      case 'uz': return text.uz;
      case 'uzLatin': return text.uzLatin;
      case 'ru': return text.ru;
      default: return text.uzLatin;
    }
  };

  return { language, setLanguage, t };
}
