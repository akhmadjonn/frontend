'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { useAuth } from '@/hooks/use-auth';
import type { LeaderboardDto, LeaderboardEntryDto } from '@/types/engagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'alltime';

function UserAvatar({ firstName, lastName, rank }: { firstName: string | null; lastName: string | null; rank: number }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  const rankColors: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-700 ring-2 ring-[#FFD700] dark:bg-yellow-900/30 dark:text-yellow-400',
    2: 'bg-gray-100 text-gray-600 ring-2 ring-[#C0C0C0] dark:bg-gray-800/30 dark:text-gray-400',
    3: 'bg-orange-100 text-orange-700 ring-2 ring-[#CD7F32] dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className={cn(
      'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0',
      rankColors[rank] ?? 'bg-muted text-muted-foreground'
    )}>
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">&#x1F947;</span>;
  if (rank === 2) return <span className="text-lg">&#x1F948;</span>;
  if (rank === 3) return <span className="text-lg">&#x1F949;</span>;
  return <span className="text-sm font-semibold text-muted-foreground w-6 text-center tabular-nums">{rank}</span>;
}

function LeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntryDto; isCurrentUser: boolean }) {
  const name = [entry.firstName, entry.lastName].filter(Boolean).join(' ') || '---';

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted/30',
      isCurrentUser && 'bg-blue-50 dark:bg-blue-950/30 ring-2 ring-[oklch(0.588_0.158_241)]/20 shadow-sm'
    )}>
      <RankBadge rank={entry.rank} />
      <UserAvatar firstName={entry.firstName} lastName={entry.lastName} rank={entry.rank} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{entry.xpValue.toLocaleString()} XP</p>
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
        Lv. {entry.level}
      </Badge>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-5 w-6" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

function getInitials(firstName: string | null, lastName: string | null) {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
}

export default function LeaderboardPage() {
  const { ts } = useLocale();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [data, setData] = useState<LeaderboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get<LeaderboardDto>(`/leaderboard?period=${period}&limit=50`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: ts('leaderboard.daily') },
    { value: 'weekly', label: ts('leaderboard.weekly') },
    { value: 'alltime', label: ts('leaderboard.alltime') },
  ];

  const currentUserInList = data?.rankings.some((e) => e.userId === user?.id);
  const entries = data?.rankings ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('leaderboard.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('leaderboard.topPlayers')}</p>
      </div>

      <div className="flex gap-2">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant="outline"
            size="sm"
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-xl',
              period === p.value && 'bg-[oklch(0.588_0.158_241)] text-white hover:bg-[oklch(0.588_0.158_241)]/90 hover:text-white'
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* 2nd place */}
          <div className="flex flex-col items-center pt-8">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-lg font-bold">
              {getInitials(entries[1].firstName, entries[1].lastName)}
            </div>
            <p className="text-sm font-semibold mt-2 truncate max-w-full">{[entries[1].firstName, entries[1].lastName].filter(Boolean).join(' ') || '---'}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{entries[1].xpValue.toLocaleString()} XP</p>
            <div className="mt-2 text-2xl">&#x1F948;</div>
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl font-bold ring-2 ring-amber-300">
              {getInitials(entries[0].firstName, entries[0].lastName)}
            </div>
            <p className="text-sm font-bold mt-2 truncate max-w-full">{[entries[0].firstName, entries[0].lastName].filter(Boolean).join(' ') || '---'}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{entries[0].xpValue.toLocaleString()} XP</p>
            <div className="mt-2 text-3xl">&#x1F947;</div>
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center pt-10">
            <div className="h-11 w-11 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-lg font-bold">
              {getInitials(entries[2].firstName, entries[2].lastName)}
            </div>
            <p className="text-sm font-semibold mt-2 truncate max-w-full">{[entries[2].firstName, entries[2].lastName].filter(Boolean).join(' ') || '---'}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{entries[2].xpValue.toLocaleString()} XP</p>
            <div className="mt-2 text-xl">&#x1F949;</div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-2 sm:p-4">
          {loading ? (
            <LoadingSkeleton />
          ) : !data || data.rankings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">{ts('leaderboard.noData')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.rankings.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === user?.id}
                />
              ))}

              {!currentUserInList && data.currentUser && (
                <>
                  <Separator className="my-3" />
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground mb-2 px-3">{ts('leaderboard.yourRank')}</p>
                    <LeaderboardRow entry={data.currentUser} isCurrentUser />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
