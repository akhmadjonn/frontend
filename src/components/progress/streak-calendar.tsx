'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StreakDay {
  date: string;
  accuracy: number;
  questionCount?: number;
}

interface StreakCalendarProps {
  data?: StreakDay[];
  loading?: boolean;
  days?: number;
}

export default function StreakCalendar({ data, loading, days = 90 }: StreakCalendarProps) {
  if (loading)
    return <Card><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>;

  const cells = useMemo(() => {
    const today = new Date();
    const activityMap = new Map<string, StreakDay>();
    (data ?? []).forEach((d) => activityMap.set(d.date.slice(0, 10), d));

    const result: Array<{ date: string; level: number; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entry = activityMap.get(key);
      const count = entry?.questionCount ?? 0;
      let level = 0;
      if (count > 0) level = 1;
      if (count >= 10) level = 2;
      if (count >= 25) level = 3;
      if (count >= 50) level = 4;
      result.push({ date: key, level, count });
    }
    return result;
  }, [data, days]);

  const LEVEL_COLORS = [
    'bg-muted',
    'bg-green-200 dark:bg-green-900/40',
    'bg-green-400 dark:bg-green-700/60',
    'bg-green-600 dark:bg-green-500/80',
    'bg-green-800 dark:bg-green-400',
  ];

  // Group into weeks (columns) for GitHub-style grid
  const weeks: Array<typeof cells> = [];
  let week: typeof cells = [];
  const firstDate = cells[0] ? new Date(cells[0].date) : new Date();
  const startDow = firstDate.getDay(); // 0=Sun
  // Pad first week
  for (let i = 0; i < startDow; i++) week.push({ date: '', level: -1, count: 0 });
  for (const cell of cells) {
    week.push(cell);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Faollik (90 kun)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {w.map((cell, ci) => (
                <div
                  key={ci}
                  className={cn(
                    'h-2.5 w-2.5 rounded-[2px] transition-colors',
                    cell.level === -1 ? 'bg-transparent' : LEVEL_COLORS[cell.level],
                  )}
                  title={cell.date ? `${cell.date}: ${cell.count} savol` : ''}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
          <span>Kam</span>
          {LEVEL_COLORS.map((c, i) => (
            <div key={i} className={cn('h-2.5 w-2.5 rounded-[2px]', c)} />
          ))}
          <span>Ko&apos;p</span>
        </div>
      </CardContent>
    </Card>
  );
}
