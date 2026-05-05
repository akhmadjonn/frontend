'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import Header from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';
import {
  LayoutGrid, CircleHelp, Layers, BookCopy,
  Crown, Wallet, UsersRound, Bell,
  History, SlidersHorizontal,
  Banknote, AlertTriangle, Heart, BookOpenText, Eye,
  SignpostBig, Ruler, PlayCircle,
} from 'lucide-react';

const ADMIN_NAV = [
  { labelKey: 'admin.navDashboard', href: '/admin', icon: LayoutGrid, color: 'text-blue-500' },
  { sectionKey: 'admin.navContent' },
  { labelKey: 'admin.navQuestions', href: '/admin/questions', icon: CircleHelp, color: 'text-amber-500' },
  { labelKey: 'admin.navCategories', href: '/admin/categories', icon: Layers, color: 'text-green-500' },
  { labelKey: 'admin.navTemplates', href: '/admin/exam-templates', icon: BookCopy, color: 'text-purple-500' },
  { sectionKey: 'admin.navReference' },
  { labelKey: 'admin.navFines', href: '/admin/fines', icon: Banknote, color: 'text-red-500' },
  { labelKey: 'admin.navHazardLabels', href: '/admin/hazard-labels', icon: AlertTriangle, color: 'text-orange-500' },
  { labelKey: 'admin.navFirstAid', href: '/admin/first-aid', icon: Heart, color: 'text-rose-500' },
  { labelKey: 'admin.navGlossary', href: '/admin/glossary', icon: BookOpenText, color: 'text-cyan-500' },
  { labelKey: 'admin.navColorVision', href: '/admin/color-vision', icon: Eye, color: 'text-violet-500' },
  { labelKey: 'admin.navRoadSigns', href: '/admin/road-signs', icon: SignpostBig, color: 'text-sky-500' },
  { labelKey: 'admin.navRoadMarkings', href: '/admin/road-markings', icon: Ruler, color: 'text-teal-500' },
  { labelKey: 'admin.navLessons', href: '/admin/video-lessons', icon: PlayCircle, color: 'text-indigo-500' },
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
      <div className="flex min-h-screen admin-bg">
        {/* Glass sidebar */}
        <aside className="hidden md:flex flex-col w-60 min-h-screen glass-sidebar px-3 py-5 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-8">
            <Image src="/logo-full.svg" alt="Avtolider" width={40} height={22} className="shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight">{ts('admin.panelTitle')}</span>
              <span className="text-[9px] font-bold bg-[oklch(0.588_0.158_241)] text-white px-1.5 py-0.5 rounded-md uppercase">Admin</span>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
            {ADMIN_NAV.map((item, i) => {
              if ('sectionKey' in item)
                return <p key={i} className="mt-6 mb-2 px-3 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest">{ts(item.sectionKey!)}</p>;
              const Icon = item.icon!;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                    active
                      ? 'bg-[oklch(0.95_0.03_241)] text-foreground font-semibold border-l-[3px] border-[oklch(0.588_0.158_241)]'
                      : 'text-muted-foreground font-medium hover:bg-white/40 hover:text-foreground border-l-[3px] border-transparent'
                  )}
                >
                  <Icon className={cn('h-[18px] w-[18px] shrink-0', item.color)} />
                  {ts(item.labelKey!)}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 animate-fade-up">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
