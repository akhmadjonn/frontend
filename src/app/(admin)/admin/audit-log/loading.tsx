import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLogLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
