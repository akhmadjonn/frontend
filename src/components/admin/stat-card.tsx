'use client';

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
      <div className={cn('glass-card stat-glow p-5', className)}>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
    );

  return (
    <div className={cn('glass-card stat-glow p-5', className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', iconColor ?? 'bg-primary/10 text-primary')}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <p className="text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      {(description || trend) && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {trend && (
            <span className={cn('font-semibold', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
          )}
          {trend && description ? ' ' : ''}
          {description}
        </p>
      )}
    </div>
  );
}
