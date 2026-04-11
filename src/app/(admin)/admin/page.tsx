'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import type { AdminDashboardDto, RevenueReportDto } from '@/types/admin';
import StatCard from '@/components/admin/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileQuestion, GraduationCap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useLocale } from '@/hooks/use-locale';
import { useLocaleStore } from '@/stores/locale-store';
import { getDateLocale } from '@/lib/date-locale';

const RevenueChart = dynamic(() => import('@/components/admin/revenue-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

const formatMoney = (tiyins: number) =>
  `${(tiyins / 100).toLocaleString('uz-UZ')} so'm`;

const EXAM_MODE_COLORS: Record<string, string> = {
  exam: 'bg-blue-500',
  Exam: 'bg-blue-500',
  ticket: 'bg-amber-500',
  Ticket: 'bg-amber-500',
  marathon: 'bg-green-500',
  Marathon: 'bg-green-500',
  speedChallenge: 'bg-orange-500',
  SpeedChallenge: 'bg-orange-500',
  hardMode: 'bg-red-500',
  HardMode: 'bg-red-500',
};

export default function AdminDashboardPage() {
  const { ts } = useLocale();
  const language = useLocaleStore((s) => s.language);
  const dateLocale = getDateLocale(language);
  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [revenue, setRevenue] = useState<RevenueReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  const EXAM_MODE_LABELS: Record<string, string> = {
    exam: ts('admin.dashboard.modeExam'),
    Exam: ts('admin.dashboard.modeExam'),
    ticket: ts('admin.dashboard.modeTicket'),
    Ticket: ts('admin.dashboard.modeTicket'),
    marathon: ts('admin.dashboard.modeMarathon'),
    Marathon: ts('admin.dashboard.modeMarathon'),
    speedChallenge: ts('admin.dashboard.modeSpeed'),
    SpeedChallenge: ts('admin.dashboard.modeSpeed'),
    hardMode: ts('admin.dashboard.modeHard'),
    HardMode: ts('admin.dashboard.modeHard'),
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashData, revData] = await Promise.all([
          apiClient.get<AdminDashboardDto>('/admin/dashboard'),
          apiClient.get<RevenueReportDto>('/admin/payments/revenue'),
        ]);
        setDashboard(dashData);
        setRevenue(revData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : ts('admin.dashboard.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.dashboard.title')}</h1>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={ts('admin.dashboard.users')}
          value={loading ? 0 : dashboard?.totalUsers.toLocaleString() ?? '0'}
          icon={Users}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          description={`+${dashboard?.newUsersThisWeek ?? 0} ${ts('admin.dashboard.thisWeek')}`}
          loading={loading}
        />
        <StatCard
          title={ts('admin.dashboard.activeQuestions')}
          value={loading ? 0 : dashboard?.activeQuestions.toLocaleString() ?? '0'}
          icon={FileQuestion}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          description={`${dashboard?.totalQuestions.toLocaleString() ?? 0} ${ts('admin.dashboard.totalLabel')}`}
          loading={loading}
        />
        <StatCard
          title={ts('admin.dashboard.examSessions')}
          value={loading ? 0 : dashboard?.totalExamSessions.toLocaleString() ?? '0'}
          icon={GraduationCap}
          iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          description={`${dashboard?.activeSubscriptions ?? 0} ${ts('admin.dashboard.activeSubscriptions')}`}
          loading={loading}
        />
        <StatCard
          title={ts('admin.dashboard.revenue')}
          value={loading ? 0 : formatMoney(dashboard?.totalRevenue ?? 0)}
          icon={DollarSign}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          description={`${dashboard?.activeSubscriptions ?? 0} ${ts('admin.dashboard.activeSubscriptions')}`}
          loading={loading}
        />
      </div>

      {/* Revenue chart + exam mode breakdown */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="glass-card p-5 lg:col-span-4">
          <div className="pb-2">
            <h3 className="text-base font-semibold">{ts('admin.dashboard.dailyRevenue')}</h3>
          </div>
          <div>
            <RevenueChart data={revenue?.dailyBreakdown} loading={loading} />
          </div>
        </div>

        <div className="glass-card p-5 lg:col-span-3">
          <div className="pb-2">
            <h3 className="text-base font-semibold">{ts('admin.dashboard.examTypes')}</h3>
          </div>
          <div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : !dashboard?.examModeBreakdown.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {ts('admin.dashboard.noData')}
              </p>
            ) : (
              <div className="space-y-4">
                {dashboard.examModeBreakdown.map((item) => {
                  const total = dashboard.examModeBreakdown.reduce((s, m) => s + m.count, 0);
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const barColor = EXAM_MODE_COLORS[item.mode] ?? 'bg-primary';

                  return (
                    <div key={item.mode} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {EXAM_MODE_LABELS[item.mode] ?? item.mode}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {item.count.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="glass-card p-5">
        <div className="pb-2">
          <h3 className="text-base font-semibold">{ts('admin.dashboard.newUsers')}</h3>
        </div>
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !dashboard?.recentUsers.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {ts('admin.dashboard.usersNotFound')}
            </p>
          ) : (
            <div className="space-y-2">
              {dashboard.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 hover:bg-white/30 rounded-xl transition-colors p-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(user.firstName ?? user.phoneNumber ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.firstName ?? user.phoneNumber ?? ts('admin.dashboard.unknown')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: dateLocale })}
                    </p>
                  </div>
                  {user.phoneNumber && (
                    <span className="text-xs text-muted-foreground hidden sm:block tabular-nums">
                      {user.phoneNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
