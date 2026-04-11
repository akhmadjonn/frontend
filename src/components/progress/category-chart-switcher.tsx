'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

interface CategoryPerformance { categoryName: { uz: string; uzLatin: string; ru: string }; accuracy: number }
interface Props { data?: CategoryPerformance[]; loading?: boolean }

const STORAGE_KEY = 'avtolider-category-chart-view';
type ViewType = 'rings' | 'heat';

const PALETTE = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', '#0EA5E9', '#14B8A6', '#F59E0B',
];

const SHORT_NAMES: Record<string, string> = {
  "Yo'l belgilari": "Yo'l bel.", "Harakat qoidalari": "Harakat q.",
  "Tezlik chegaralari": "Tezlik ch.", "Birinchi tibbiy yordam": "Birinchi t.",
  "Birinchi tibbiy": "Birinchi t.", "Ustunlik qoidalari": "Ustunlik q.",
  "To'xtash va stoyanka": "To'xtash", "Svetofor ishoralari": "Svetofor",
  "Transport vositalari": "Transport v.", "Yo'l chiziqlari": "Yo'l chiz.",
  "Haydovchi majburiyatlari": "Hayd. maj.", "Yo'lovchilar xavfsizligi": "Yo'lov. xavf.",
  "Piyodalar harakati": "Piyodalar", "Chorrahalar": "Chorrahalar",
};
function getShortName(name: string) {
  return SHORT_NAMES[name] || (name.length > 12 ? name.slice(0, 10) + '.' : name);
}

interface ChartItem { name: string; shortName: string; percentage: number; color: string }

const R = 26, SW = 4.5, CIRC = 2 * Math.PI * R;

function RingsView({ data }: { data: ChartItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {data.map((d) => {
        const offset = CIRC * (1 - d.percentage / 100);
        return (
          <div key={d.name} className="flex flex-col items-center gap-1.5">
            <svg viewBox="0 0 60 60" width={64} height={64}>
              <circle cx={30} cy={30} r={R} fill="none" strokeWidth={SW} className="stroke-muted" />
              {d.percentage > 0 && (
                <circle
                  cx={30} cy={30} r={R} fill="none" strokeWidth={SW}
                  strokeLinecap="round" strokeDasharray={CIRC}
                  strokeDashoffset={offset}
                  transform="rotate(-90 30 30)"
                  style={{ stroke: d.color }}
                />
              )}
            </svg>
            <span className="text-base font-semibold tabular-nums" style={{ color: d.color }}>{d.percentage}%</span>
            <span className="text-sm text-muted-foreground text-center leading-tight max-w-[90px]">{d.shortName}</span>
          </div>
        );
      })}
    </div>
  );
}

function HeatView({ data }: { data: ChartItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {data.map((d) => (
        <div key={d.name} className="rounded-lg p-4 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: d.color, opacity: 0.1 }}
          />
          <span className="text-xs text-muted-foreground block relative leading-tight mb-1">{d.shortName}</span>
          <span className="text-xl font-semibold tabular-nums relative" style={{ color: d.color }}>{d.percentage}%</span>
        </div>
      ))}
    </div>
  );
}

export default function CategoryChartSwitcher({ data, loading }: Props) {
  const { language } = useLocaleStore();

  const [view, setView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'rings' || saved === 'heat') return saved;
    }
    return 'rings';
  });

  const { ts } = useLocale();

  function switchView(v: ViewType) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  if (loading)
    return <Card><CardContent className="p-4"><Skeleton className="h-52 w-full" /></CardContent></Card>;

  const chartData: ChartItem[] = (data ?? []).slice(0, 8).map((d, i) => {
    const name = (d.categoryName[language] ?? d.categoryName.uzLatin).slice(0, 16);
    return { name, shortName: getShortName(name), percentage: Math.round(d.accuracy), color: PALETTE[i % PALETTE.length] };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{ts('dashboard.categoryPerformance')}</CardTitle>
          <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
            {(['rings', 'heat'] as const).map((v) => (
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
                {v === 'rings' ? 'Rings' : 'Heat'}
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
              {view === 'rings' && <RingsView data={chartData} />}
              {view === 'heat' && <HeatView data={chartData} />}
            </div>
          )
        }
      </CardContent>
    </Card>
  );
}
