'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { CalendarDays, TrendingUp, Flame, Zap } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface DailyActivityProps {
  accuracyData?: Array<{ date: string; accuracy: number; questionCount?: number }>;
  questionsToday?: number;
  loading?: boolean;
}

const DAY_LABELS_UZ = ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha'];
const DAY_LABELS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function getBarColor(count: number, isToday: boolean, max: number) {
  if (count === 0) return '#e5e7eb'; // gray-200
  if (isToday) return '#3b82f6'; // blue-500
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.7) return '#22c55e'; // green-500
  if (ratio >= 0.4) return '#06b6d4'; // cyan-500
  return '#8b5cf6'; // violet-500
}

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
  const maxCount = Math.max(...weekData.map(d => d.count), 1);
  const activeDays = weekData.filter(d => d.count > 0).length;

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
            <CalendarDays className="h-4 w-4 text-blue-500" />
            {ts('dashboard.dailyActivity') || "Kunlik faollik"}
          </CardTitle>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">{ts('dashboard.weekAvg') || "Haftalik o'rtacha"}:</span>
            <strong className="text-foreground">{weekAvg}</strong>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-blue-700 dark:text-blue-300">{questionsToday ?? 0}</p>
              <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">{ts('dashboard.todayQuestions') || "Bugun"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-300">{weekTotal}</p>
              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">{ts('dashboard.thisWeek') || "Shu hafta"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-amber-700 dark:text-amber-300">{activeDays}/7</p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">{ts('dashboard.activeDays') || "Faol kunlar"}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} barSize={32}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={(props: any) => {
                  const { x, y, payload } = props;
                  const entry = weekData.find(d => d.name === payload.value);
                  return (
                    <text
                      x={x}
                      y={y + 12}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={entry?.isToday ? 700 : 400}
                      fill={entry?.isToday ? '#3b82f6' : 'var(--muted-foreground)'}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.2, radius: 6 }}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 12,
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                formatter={(value) => [`${value} ${ts('common.question')}`, '']}
                labelFormatter={(label) => {
                  const entry = weekData.find(d => d.name === label);
                  return entry?.isToday ? `📍 ${label} (${ts('dashboard.today') || "Bugun"})` : label;
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 4, 4]} animationDuration={800}>
                {weekData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={getBarColor(entry.count, entry.isToday, maxCount)}
                    opacity={entry.count === 0 ? 0.4 : 1}
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
