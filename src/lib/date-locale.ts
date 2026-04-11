import { ru } from 'date-fns/locale/ru';
import { uz } from 'date-fns/locale/uz';
import { uzCyrl } from 'date-fns/locale/uz-Cyrl';
import type { Locale } from 'date-fns';

const LOCALE_MAP: Record<string, Locale> = {
  ru,
  uz: uz,
  uzLatin: uz,
};

// uz-Cyrl is exported as uzCyrl
LOCALE_MAP['uz-Cyrl'] = uzCyrl;

export function getDateLocale(language: string): Locale {
  return LOCALE_MAP[language] ?? uz;
}
