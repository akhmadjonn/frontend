import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ExamLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
