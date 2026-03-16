'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BookOpen, GraduationCap, TrendingUp, Settings } from 'lucide-react';

const TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Bosh', activeColor: 'text-blue-600 dark:text-blue-400' },
  { href: '/practice', icon: BookOpen, label: 'Mashq', activeColor: 'text-emerald-600 dark:text-emerald-400' },
  { href: '/exam', icon: GraduationCap, label: 'Imtihon', activeColor: 'text-violet-600 dark:text-violet-400' },
  { href: '/progress', icon: TrendingUp, label: 'Progress', activeColor: 'text-orange-600 dark:text-orange-400' },
  { href: '/settings', icon: Settings, label: 'Sozlama', activeColor: 'text-gray-600 dark:text-gray-400' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background md:hidden">
      {TABS.map(({ href, icon: Icon, label, activeColor }) => {
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
            <Icon className={cn('h-5 w-5', active && activeColor)} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
