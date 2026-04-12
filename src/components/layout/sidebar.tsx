'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/stores/locale-store';
import {
  LayoutDashboard, BookOpen, GraduationCap, TrendingUp, CreditCard, Settings,
  Banknote, AlertTriangle, Heart, BookOpenText, Eye, Trophy, Star,
  SignpostBig, Ruler,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: { uzLatin: string; uz: string; ru: string };
  color: string;
}

interface NavSection {
  sectionLabel: { uzLatin: string; uz: string; ru: string };
}

type NavEntry = NavItem | NavSection;

const NAV_ENTRIES: NavEntry[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: { uzLatin: 'Bosh sahifa', uz: 'Бош саҳифа', ru: 'Главная' }, color: 'text-blue-600 dark:text-blue-400' },
  { href: '/practice', icon: BookOpen, label: { uzLatin: 'Mashq', uz: 'Машқ', ru: 'Практика' }, color: 'text-emerald-600 dark:text-emerald-400' },
  { href: '/exam', icon: GraduationCap, label: { uzLatin: 'Imtihon', uz: 'Имтиҳон', ru: 'Экзамен' }, color: 'text-violet-600 dark:text-violet-400' },
  { href: '/progress', icon: TrendingUp, label: { uzLatin: 'Progress', uz: 'Прогресс', ru: 'Прогресс' }, color: 'text-orange-600 dark:text-orange-400' },
  { href: '/leaderboard', icon: Trophy, label: { uzLatin: 'Reyting', uz: 'Рейтинг', ru: 'Рейтинг' }, color: 'text-yellow-600 dark:text-yellow-400' },
  { href: '/favorites', icon: Star, label: { uzLatin: 'Sevimlilar', uz: 'Севимлилар', ru: 'Избранное' }, color: 'text-pink-600 dark:text-pink-400' },
  { sectionLabel: { uzLatin: "Ma'lumotnoma", uz: 'Маълумотнома', ru: 'Справочник' } },
  { href: '/road-signs', icon: SignpostBig, label: { uzLatin: "Yo'l belgilari", uz: 'Йўл белгилари', ru: 'Дорожные знаки' }, color: 'text-blue-600 dark:text-blue-400' },
  { href: '/road-markings', icon: Ruler, label: { uzLatin: "Yo'l chiziqlari", uz: 'Йўл чизиқлари', ru: 'Дорожная разметка' }, color: 'text-teal-600 dark:text-teal-400' },
  { href: '/fines', icon: Banknote, label: { uzLatin: 'Jarimalar', uz: 'Жарималар', ru: 'Штрафы' }, color: 'text-red-600 dark:text-red-400' },
  { href: '/hazard-labels', icon: AlertTriangle, label: { uzLatin: 'Xavfli yuklar', uz: 'Хавфли юклар', ru: 'Опасные грузы' }, color: 'text-orange-600 dark:text-orange-400' },
  { href: '/first-aid', icon: Heart, label: { uzLatin: 'Birinchi yordam', uz: 'Биринчи ёрдам', ru: 'Первая помощь' }, color: 'text-rose-600 dark:text-rose-400' },
  { href: '/glossary', icon: BookOpenText, label: { uzLatin: "Lug'at", uz: 'Луғат', ru: 'Словарь' }, color: 'text-cyan-600 dark:text-cyan-400' },
  { href: '/color-vision', icon: Eye, label: { uzLatin: "Rang ko'rish", uz: 'Ранг кўриш', ru: 'Цветовое зрение' }, color: 'text-purple-600 dark:text-purple-400' },
  { sectionLabel: { uzLatin: '', uz: '', ru: '' } },
  { href: '/subscription', icon: CreditCard, label: { uzLatin: 'Obuna', uz: 'Обуна', ru: 'Подписка' }, color: 'text-amber-600 dark:text-amber-400' },
  { href: '/settings', icon: Settings, label: { uzLatin: 'Sozlamalar', uz: 'Созламалар', ru: 'Настройки' }, color: 'text-gray-600 dark:text-gray-400' },
];

function isSection(entry: NavEntry): entry is NavSection {
  return 'sectionLabel' in entry;
}

export default function Sidebar() {
  const pathname = usePathname();
  const language = useLocaleStore((s) => s.language);

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-card/80 backdrop-blur-sm shadow-[1px_0_0_0_var(--border)] px-3 py-5 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 mb-8">
        <Image src="/logo-full.svg" alt="AvtoLider" width={48} height={26} className="shrink-0" priority />
        <span className="font-extrabold text-base tracking-tight">AvtoLider</span>
      </Link>

      <nav aria-label="Main navigation" className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {NAV_ENTRIES.map((entry, i) => {
          if (isSection(entry)) {
            const text = entry.sectionLabel[language] ?? entry.sectionLabel.uzLatin;
            if (!text) return <div key={i} className="my-3" />;
            return (
              <p key={i} className="mt-6 mb-2 px-3 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                {text}
              </p>
            );
          }
          const { href, icon: Icon, label, color } = entry;
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                active
                  ? 'bg-[oklch(0.95_0.03_241)] dark:bg-blue-950/30 text-foreground font-semibold border-l-[3px] border-[oklch(0.588_0.158_241)] ml-0'
                  : 'text-muted-foreground font-medium hover:bg-muted/50 hover:text-foreground border-l-[3px] border-transparent'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', color)} />
              {label[language] ?? label.uzLatin}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
