'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocaleStore } from '@/stores/locale-store';

interface CategoryPerformance {
  categoryName: { uz: string; uzLatin: string; ru: string };
  accuracy: number;
}

interface CategoryRadarProps {
  data?: CategoryPerformance[];
  loading?: boolean;
}

export default function CategoryRadar({ data, loading }: CategoryRadarProps) {
  const { language } = useLocaleStore();

  if (loading)
    return <Card><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>;

  const chartData = (data ?? []).slice(0, 8).map((d) => ({
    name: (d.categoryName[language] ?? d.categoryName.uzLatin).slice(0, 16),
    accuracy: Math.round(d.accuracy),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Kategoriyalar bo&apos;yicha</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length === 0
          ? <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</div>
          : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 9 }} />
                <Radar dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                <Tooltip formatter={(v) => [`${v}%`, 'Aniqlik']} contentStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          )
        }
      </CardContent>
    </Card>
  );
}
