'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface AccuracyDataPoint { date: string; accuracy: number; questionCount?: number; }
interface AccuracyChartProps { data?: AccuracyDataPoint[]; loading?: boolean; }

export default function AccuracyChart({ data, loading }: AccuracyChartProps) {
  if (loading)
    return <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const chartData = (data ?? []).map((d) => ({
    date: format(new Date(d.date), 'MM/dd'),
    accuracy: Math.round(d.accuracy),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Aniqlik (30 kun)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length === 0
          ? <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</div>
          : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Aniqlik']} contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )
        }
      </CardContent>
    </Card>
  );
}
