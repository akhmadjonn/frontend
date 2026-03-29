'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface DailyActivityProps {
  accuracyData?: Array<{ date: string; accuracy: number; questionCount?: number }>;
  questionsToday?: number;
  loading?: boolean;
}

const DAY_LABELS_UZ = ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha'];
const DAY_LABELS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function DailyActivity({ accuracyData, questionsToday, loading }: DailyActivityProps) {
  const { ts, language } = useLocale();
  const dayLabels = language === 'ru' ? DAY_LABELS_RU : DAY_LABELS_UZ;

  const weekData = useMemo(() => {
    const days: Array<{ name: string; count: number; isToday: boolean }> = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayIndex = d.getDay();
      const match = accuracyData?.find(a => a.date === dateStr);

      days.push({
        name: dayLabels[dayIndex],
        count: i === 0 ? (questionsToday ?? match?.questionCount ?? 0) : (match?.questionCount ?? 0),
        isToday: i === 0,
      });
    }
    return days;
  }, [accuracyData, questionsToday, dayLabels]);

  const weekTotal = weekData.reduce((sum, d) => sum + d.count, 0);
  const weekAvg = Math.round(weekTotal / 7);

  if (loading)
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {ts('dashboard.dailyActivity') || "Kunlik faollik"}
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {ts('dashboard.weekAvg') || "Haftalik o'rtacha"}: <strong className="text-foreground ml-0.5">{weekAvg}</strong>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="text-3xl font-bold tracking-tight">{questionsToday ?? 0}</p>
            <p className="text-xs text-muted-foreground">{ts('dashboard.todayQuestions') || "Bugun javob berilgan"}</p>
          </div>
          <div className="text-right ml-auto">
            <p className="text-lg font-semibold">{weekTotal}</p>
            <p className="text-xs text-muted-foreground">{ts('dashboard.thisWeek') || "Shu hafta"}</p>
          </div>
        </div>

        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} barSize={28}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '6px 10px',
                }}
                formatter={(value) => [`${value} ${ts('common.question')}`, '']}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {weekData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isToday ? 'var(--primary)' : entry.count > 0 ? 'var(--primary)' : 'var(--muted)'}
                    opacity={entry.isToday ? 1 : entry.count > 0 ? 0.5 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(DailyActivity);
