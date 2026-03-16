'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, GraduationCap, Flame, Trophy } from 'lucide-react';

interface StatsCardsProps {
  data?: {
    totalQuestionsPracticed: number;
    totalExamsTaken: number;
    currentStreak: number;
    examPassRate: number;
  };
  loading?: boolean;
}

const CARDS = [
  {
    key: 'totalQuestionsPracticed' as const,
    label: "Mashq savollar",
    icon: BookOpen,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'totalExamsTaken' as const,
    label: 'Imtihonlar',
    icon: GraduationCap,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    format: (v: number) => v.toString(),
  },
  {
    key: 'currentStreak' as const,
    label: 'Seriya',
    icon: Flame,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    format: (v: number) => `${v} kun`,
  },
  {
    key: 'examPassRate' as const,
    label: "O'tish darajasi",
    icon: Trophy,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    format: (v: number) => `${Math.round(v)}%`,
  },
];

function StatsCards({ data, loading }: StatsCardsProps) {
  if (loading)
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, iconBg, iconColor, format }) => (
        <Card key={key}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>
                <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                <p className="text-xl font-bold tracking-tight">{data ? format(data[key]) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default memo(StatsCards);
