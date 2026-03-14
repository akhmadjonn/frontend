'use client';

import { useEffect } from 'react';
import { useLocaleStore } from '@/stores/locale-store';
import type { Locale } from '@/stores/locale-store';

export default function LocaleHydrator() {
  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && ['uz', 'uzLatin', 'ru'].includes(saved))
      useLocaleStore.setState({ language: saved });
  }, []);

  return null;
}
