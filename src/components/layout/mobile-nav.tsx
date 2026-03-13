'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BookOpen, GraduationCap, TrendingUp, Settings } from 'lucide-react';

const TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Bosh' },
  { href: '/practice', icon: BookOpen, label: 'Mashq' },
  { href: '/exam', icon: GraduationCap, label: 'Imtihon' },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/settings', icon: Settings, label: 'Sozlama' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background md:hidden">
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'text-primary')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
