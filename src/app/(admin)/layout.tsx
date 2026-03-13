'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import Header from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileQuestion, FolderTree, ClipboardList, CreditCard, DollarSign, Users, Megaphone, ScrollText, Settings } from 'lucide-react';

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { section: 'Kontent' },
  { label: 'Savollar', href: '/admin/questions', icon: FileQuestion },
  { label: 'Kategoriyalar', href: '/admin/categories', icon: FolderTree },
  { label: 'Shablonlar', href: '/admin/exam-templates', icon: ClipboardList },
  { section: 'Biznes' },
  { label: 'Rejalar', href: '/admin/plans', icon: CreditCard },
  { label: "To'lovlar", href: '/admin/payments', icon: DollarSign },
  { label: 'Foydalanuvchilar', href: '/admin/users', icon: Users },
  { section: 'Tizim' },
  { label: 'E\'lonlar', href: '/admin/announcements', icon: Megaphone },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText },
  { label: 'Sozlamalar', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard requireAdmin>
      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col w-60 min-h-screen border-r bg-background px-3 py-4 shrink-0">
          <div className="px-3 py-2 mb-4">
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <nav className="flex flex-col gap-0.5 flex-1">
            {ADMIN_NAV.map((item, i) => {
              if ('section' in item)
                return <p key={i} className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.section}</p>;
              const Icon = item.icon!;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
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
