'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
  className?: string;
  iconColor?: string;
}

export default function StatCard({ title, value, icon: Icon, description, trend, loading, className, iconColor }: StatCardProps) {
  if (loading)
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', iconColor ?? 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={cn('font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
            )}
            {trend && description ? ' ' : ''}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
