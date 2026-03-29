'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';
import {
  LayoutDashboard, BookOpen, GraduationCap, TrendingUp, MoreHorizontal,
  Banknote, AlertTriangle, Heart, BookOpenText, Eye, Trophy, Star, Settings, CreditCard, X,
} from 'lucide-react';

const TABS = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboardShort', activeColor: 'text-blue-600 dark:text-blue-400' },
  { href: '/practice', icon: BookOpen, labelKey: 'nav.practice', activeColor: 'text-emerald-600 dark:text-emerald-400' },
  { href: '/exam', icon: GraduationCap, labelKey: 'nav.exam', activeColor: 'text-violet-600 dark:text-violet-400' },
  { href: '/progress', icon: TrendingUp, labelKey: 'nav.progress', activeColor: 'text-orange-600 dark:text-orange-400' },
];

const MORE_ITEMS = [
  { href: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard', color: 'text-yellow-600' },
  { href: '/favorites', icon: Star, labelKey: 'nav.favorites', color: 'text-pink-600' },
  { href: '/fines', icon: Banknote, labelKey: 'nav.fines', color: 'text-red-600' },
  { href: '/hazard-labels', icon: AlertTriangle, labelKey: 'nav.hazardLabels', color: 'text-orange-600' },
  { href: '/first-aid', icon: Heart, labelKey: 'nav.firstAid', color: 'text-rose-600' },
  { href: '/glossary', icon: BookOpenText, labelKey: 'nav.glossary', color: 'text-cyan-600' },
  { href: '/color-vision', icon: Eye, labelKey: 'nav.colorVision', color: 'text-purple-600' },
  { href: '/subscription', icon: CreditCard, labelKey: 'nav.subscription', color: 'text-amber-600' },
  { href: '/settings', icon: Settings, labelKey: 'nav.settingsShort', color: 'text-gray-600' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { ts } = useLocale();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-16 left-0 right-0 bg-background border-t rounded-t-2xl p-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">{ts('nav.more')}</p>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_ITEMS.map(({ href, icon: Icon, labelKey, color }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors',
                      active ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted/60'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', color)} />
                    <span className={cn('text-[10px] font-medium leading-tight', active ? 'text-foreground' : 'text-muted-foreground')}>
                      {ts(labelKey)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t bg-background md:hidden">
        {TABS.map(({ href, icon: Icon, labelKey, activeColor }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                active ? activeColor : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', activeColor)} />
              {ts(labelKey)}
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            isMoreActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MoreHorizontal className={cn('h-5 w-5', isMoreActive && 'text-blue-600 dark:text-blue-400')} />
          {ts('nav.more')}
        </button>
      </nav>
    </>
  );
}
