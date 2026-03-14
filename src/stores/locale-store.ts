import { create } from 'zustand';

type Locale = 'uz' | 'uzLatin' | 'ru';

interface LocaleState {
  language: Locale;
  setLanguage: (language: Locale) => void;
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'uzLatin';
  const saved = localStorage.getItem('locale') as Locale | null;
  if (saved && ['uz', 'uzLatin', 'ru'].includes(saved)) return saved;
  return 'uzLatin';
}

export const useLocaleStore = create<LocaleState>((set) => ({
  language: getInitialLocale(),
  setLanguage: (language) => {
    localStorage.setItem('locale', language);
    set({ language });
  },
}));

export type { Locale };
