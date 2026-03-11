import { create } from 'zustand';

type Locale = 'uz' | 'uzLatin' | 'ru';

interface LocaleState {
  language: Locale;
  setLanguage: (language: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  language: (typeof window !== 'undefined' ? (localStorage.getItem('locale') as Locale) : null) || 'uzLatin',
  setLanguage: (language) => {
    localStorage.setItem('locale', language);
    set({ language });
  },
}));
