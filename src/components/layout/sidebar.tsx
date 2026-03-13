'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/stores/locale-store';
import { LayoutDashboard, BookOpen, GraduationCap, TrendingUp, CreditCard, Settings, Car } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: { uzLatin: 'Bosh sahifa', uz: 'Бош саҳифа', ru: 'Главная' } },
  { href: '/practice', icon: BookOpen, label: { uzLatin: 'Mashq', uz: 'Машқ', ru: 'Практика' } },
  { href: '/exam', icon: GraduationCap, label: { uzLatin: 'Imtihon', uz: 'Имтиҳон', ru: 'Экзамен' } },
  { href: '/progress', icon: TrendingUp, label: { uzLatin: 'Progress', uz: 'Прогресс', ru: 'Прогресс' } },
  { href: '/subscription', icon: CreditCard, label: { uzLatin: 'Obuna', uz: 'Обуна', ru: 'Подписка' } },
  { href: '/settings', icon: Settings, label: { uzLatin: 'Sozlamalar', uz: 'Созламалар', ru: 'Настройки' } },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { language } = useLocaleStore();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r bg-background px-3 py-4 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <Car className="h-4 w-4" />
        </div>
        <span className="font-bold text-lg tracking-tight">AutoTest</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label[language] ?? label.uzLatin}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
