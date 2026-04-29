import { create } from 'zustand';
import { useEffect } from 'react';

type Locale = 'uz' | 'uzLatin' | 'ru';

interface LocaleState {
  language: Locale;
  _hydrated: boolean;
  setLanguage: (language: Locale) => void;
  _hydrate: () => void;
}

// Keep the backend's X-Api-Lang header (uz/ru/en) in sync with the UI locale.
// Both uzLatin and uz map to the backend's Uzbek messages.
const toApiLang = (locale: Locale): 'uz' | 'ru' => (locale === 'ru' ? 'ru' : 'uz');

export const useLocaleStore = create<LocaleState>((set) => ({
  language: 'uzLatin',
  _hydrated: false,
  setLanguage: (language) => {
    if (!['uz', 'uzLatin', 'ru'].includes(language)) return;
    localStorage.setItem('avtolider:locale', language);
    localStorage.setItem('app-lang', toApiLang(language));
    set({ language });
  },
  _hydrate: () => {
    const saved = localStorage.getItem('avtolider:locale') as Locale | null;
    const language = saved && ['uz', 'uzLatin', 'ru'].includes(saved) ? saved : 'uzLatin';
    if (!localStorage.getItem('app-lang')) localStorage.setItem('app-lang', toApiLang(language));
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
