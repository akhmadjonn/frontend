import { create } from 'zustand';
import { useEffect } from 'react';

type Locale = 'uz' | 'uzLatin' | 'ru';

interface LocaleState {
  language: Locale;
  _hydrated: boolean;
  setLanguage: (language: Locale) => void;
  _hydrate: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  language: 'uzLatin',
  _hydrated: false,
  setLanguage: (language) => {
    if (!['uz', 'uzLatin', 'ru'].includes(language)) return;
    localStorage.setItem('avtolider:locale', language);
    set({ language });
  },
  _hydrate: () => {
    const saved = localStorage.getItem('avtolider:locale') as Locale | null;
    const language = saved && ['uz', 'uzLatin', 'ru'].includes(saved) ? saved : 'uzLatin';
    set({ language, _hydrated: true });
  },
}));

export function useLocaleHydration() {
  const hydrate = useLocaleStore((s) => s._hydrate);
  const hydrated = useLocaleStore((s) => s._hydrated);
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);
}

export type { Locale };
