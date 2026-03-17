'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import Header from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';
import {
  LayoutGrid, CircleHelp, Layers, BookCopy,
  Crown, Wallet, UsersRound, Bell,
  History, SlidersHorizontal,
} from 'lucide-react';

const ADMIN_NAV = [
  { labelKey: 'admin.navDashboard', href: '/admin', icon: LayoutGrid, color: 'text-blue-500' },
  { sectionKey: 'admin.navContent' },
  { labelKey: 'admin.navQuestions', href: '/admin/questions', icon: CircleHelp, color: 'text-amber-500' },
  { labelKey: 'admin.navCategories', href: '/admin/categories', icon: Layers, color: 'text-green-500' },
  { labelKey: 'admin.navTemplates', href: '/admin/exam-templates', icon: BookCopy, color: 'text-purple-500' },
  { sectionKey: 'admin.navBusiness' },
  { labelKey: 'admin.navPlans', href: '/admin/plans', icon: Crown, color: 'text-amber-500' },
  { labelKey: 'admin.navPayments', href: '/admin/payments', icon: Wallet, color: 'text-emerald-500' },
  { labelKey: 'admin.navUsers', href: '/admin/users', icon: UsersRound, color: 'text-blue-500' },
  { sectionKey: 'admin.navSystem' },
  { labelKey: 'admin.navAnnouncements', href: '/admin/announcements', icon: Bell, color: 'text-orange-500' },
  { labelKey: 'admin.navAuditLog', href: '/admin/audit-log', icon: History, color: 'text-slate-500' },
  { labelKey: 'admin.navSettings', href: '/admin/settings', icon: SlidersHorizontal, color: 'text-gray-500' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ts } = useLocale();

  return (
    <AuthGuard requireAdmin>
      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col w-60 min-h-screen border-r bg-card px-3 py-4 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">A</div>
            <span className="font-bold text-base tracking-tight">{ts('admin.panelTitle')}</span>
          </div>
          <nav className="flex flex-col gap-0.5 flex-1">
            {ADMIN_NAV.map((item, i) => {
              if ('sectionKey' in item)
                return <p key={i} className="mt-5 mb-1.5 px-3 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">{ts(item.sectionKey!)}</p>;
              const Icon = item.icon!;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : item.color)} />
                  {ts(item.labelKey!)}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
