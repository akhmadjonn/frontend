'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  { key: 'totalQuestionsPracticed' as const, label: "Mashq savollar", icon: BookOpen, color: 'text-blue-500', format: (v: number) => v.toLocaleString() },
  { key: 'totalExamsTaken' as const, label: 'Imtihonlar', icon: GraduationCap, color: 'text-purple-500', format: (v: number) => v.toString() },
  { key: 'currentStreak' as const, label: 'Seriya', icon: Flame, color: 'text-orange-500', format: (v: number) => `${v} kun` },
  { key: 'examPassRate' as const, label: "O'tish darajasi", icon: Trophy, color: 'text-green-500', format: (v: number) => `${Math.round(v)}%` },
];

function StatsCards({ data, loading }: StatsCardsProps) {
  if (loading)
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, color, format }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{data ? format(data[key]) : '—'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default memo(StatsCards);
