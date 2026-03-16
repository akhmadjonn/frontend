'use client';

import { useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AccuracyDataPoint { date: string; accuracy: number; questionCount?: number }
interface Props { data?: AccuracyDataPoint[]; loading?: boolean }

const STORAGE_KEY = 'avtolider-accuracy-chart-view';
type ViewType = 'summary' | 'area';

function computeStats(data: { accuracy: number }[]) {
  const vals = data.map((d) => d.accuracy);
  if (vals.length === 0) return { avg: 0, best: 0, worst: 0, trend: 0, count: 0 };
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const best = Math.max(...vals);
  const worst = Math.min(...vals);
  const trend = vals.length >= 2 ? vals[vals.length - 1] - vals[0] : 0;
  return { avg, best, worst, trend, count: vals.length };
}

const STATS_CONFIG = [
  { key: 'avg', label: "O'rtacha" },
  { key: 'best', label: 'Eng yuqori', color: '#16A34A' },
  { key: 'worst', label: 'Eng past', color: '#EA580C' },
  { key: 'trend', label: 'Trend' },
] as const;

function SummaryView({ data, stats }: { data: { date: string; accuracy: number }[]; stats: ReturnType<typeof computeStats> }) {
  return (
    <div className="flex items-center gap-5">
      <div className="min-w-[100px] flex flex-col gap-2.5">
        {STATS_CONFIG.map((s) => {
          const val = stats[s.key];
          let color: string | undefined;
          if (s.key === 'best') color = '#16A34A';
          else if (s.key === 'worst') color = '#EA580C';
          else if (s.key === 'trend') color = val >= 0 ? '#16A34A' : '#EA580C';
          const display = s.key === 'trend' ? `${val >= 0 ? '+' : ''}${val}%` : `${val}%`;
          return (
            <div key={s.key}>
              <span className="text-[11px] text-muted-foreground block">{s.label}</span>
              <span className="text-base font-medium tabular-nums" style={color ? { color } : undefined}>{display}</span>
            </div>
          );
        })}
      </div>
      <div className="flex-1 h-[130px]">
        {stats.count < 2 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Ma&apos;lumot yig&apos;ilmoqda...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={data}>
              <YAxis domain={[0, 100]} hide />
              <Line type="monotone" dataKey="accuracy" stroke="var(--chart-1)" strokeWidth={1.5} strokeOpacity={0.35} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function AreaView({ data, count }: { data: { date: string; accuracy: number }[]; count: number }) {
  if (count < 2)
    return (
      <div className="flex items-center justify-center h-[180px]">
        <p className="text-sm text-muted-foreground">Kamida 2 ta imtihon topshiring</p>
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid horizontal vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} className="text-muted-foreground" />
        <Tooltip formatter={(v) => [`${v}%`, 'Aniqlik']} contentStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="accuracy" stroke="#2563EB" strokeWidth={2} fill="url(#accGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function AccuracyChartSwitcher({ data, loading }: Props) {
  const [view, setView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'summary' || saved === 'area') return saved;
    }
    return 'summary';
  });

  function switchView(v: ViewType) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  if (loading)
    return <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const chartData = (data ?? []).map((d) => ({
    date: format(new Date(d.date), 'MM/dd'),
    accuracy: Math.round(d.accuracy),
  }));
  const stats = computeStats(chartData);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Aniqlik (30 kun)</CardTitle>
          <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
            {(['summary', 'area'] as const).map((v) => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150',
                  view === v
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-secondary-foreground'
                )}
              >
                {v === 'summary' ? 'Summary' : 'Area'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length === 0
          ? <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</div>
          : (
            <div className="min-h-[180px] transition-opacity duration-150">
              {view === 'summary' && <SummaryView data={chartData} stats={stats} />}
              {view === 'area' && <AreaView data={chartData} count={stats.count} />}
            </div>
          )
        }
      </CardContent>
    </Card>
  );
}
