import { create } from 'zustand';

type Locale = 'uz' | 'uzLatin' | 'ru';

interface LocaleState {
  language: Locale;
  setLanguage: (language: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  language: 'uzLatin',
  setLanguage: (language) => {
    localStorage.setItem('locale', language);
    set({ language });
  },
}));

export type { Locale };
