'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { DailyRevenueDto } from '@/types/admin';
import { format, parseISO } from 'date-fns';
import { useLocale } from '@/hooks/use-locale';

interface RevenueChartProps {
  data?: DailyRevenueDto[];
  loading?: boolean;
}

const formatUzs = (tiyins: number) =>
  `${(tiyins / 100).toLocaleString('uz-UZ')} so'm`;

const formatDateLabel = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'dd.MM');
  } catch {
    return dateStr;
  }
};

export default function RevenueChart({ data, loading }: RevenueChartProps) {
  const { ts } = useLocale();

  if (loading || !data)
    return <Skeleton className="h-64 w-full" />;

  if (!data.length)
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {ts('admin.dashboard.noData')}
      </div>
    );

  const chartData = data.map((d) => ({
    date: formatDateLabel(d.date),
    revenue: d.revenue,
  }));

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${(v / 100).toLocaleString()}`}
          width={60}
        />
        <Tooltip
          formatter={(value) => [formatUzs(Number(value)), ts('admin.dashboard.revenue')]}
          labelFormatter={(label) => `${ts('admin.payments.date')}: ${label}`}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            color: 'var(--card-foreground)',
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="revenue"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
