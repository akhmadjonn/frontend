'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronLeft, ChevronRight, HeartPulse, ListChecks, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FirstAidProcedureDto } from '@/types/content';

export default function FirstAidDetailPage() {
  const { t, ts } = useLocale();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [procedure, setProcedure] = useState<FirstAidProcedureDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'step'>('all');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const fetchProcedure = async () => {
      try {
        const result = await apiClient.get<FirstAidProcedureDto>(`/first-aid/${slug}`);
        setProcedure(result);
      } catch (err: any) {
        toast.error(err?.message || ts('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchProcedure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const steps = procedure?.steps ?? [];
  const totalSteps = steps.length;
  const activeStep = steps[currentStep];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/first-aid')}
        className="gap-1.5 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {ts('firstAid.backToList')}
      </Button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !procedure ? (
        <Card>
          <CardContent className="p-8 text-center">
            <HeartPulse className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ts('firstAid.noProcedures')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-3 mb-2">
              {procedure.iconUrl ? (
                <img
                  src={procedure.iconUrl}
                  alt={t(procedure.name)}
                  className="h-10 w-10 rounded-lg object-contain shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                  <HeartPulse className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight">{t(procedure.name)}</h1>
                {procedure.summary && (
                  <p className="text-sm text-muted-foreground mt-0.5">{t(procedure.summary)}</p>
                )}
              </div>
            </div>
          </div>

          {totalSteps === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">{ts('firstAid.noSteps')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                  className="gap-1.5"
                >
                  <ListChecks className="h-4 w-4" />
                  {ts('firstAid.allSteps')}
                </Button>
                <Button
                  variant={viewMode === 'step' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setViewMode('step'); setCurrentStep(0); }}
                  className="gap-1.5"
                >
                  <Footprints className="h-4 w-4" />
                  {ts('firstAid.stepByStep')}
                </Button>
              </div>

              {viewMode === 'all' ? (
                <div className="relative pl-6">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {step.stepOrder}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold">{t(step.title)}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t(step.description)}
                          </p>
                          {step.imageUrl && (
                            <img
                              src={step.imageUrl}
                              alt={t(step.title)}
                              className="rounded-lg max-w-full h-auto max-h-48 object-contain mt-2"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {ts('firstAid.step')} {activeStep.stepOrder} / {totalSteps}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold mb-2">{t(activeStep.title)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(activeStep.description)}
                      </p>
                    </div>
                    {activeStep.imageUrl && (
                      <img
                        src={activeStep.imageUrl}
                        alt={t(activeStep.title)}
                        className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                      />
                    )}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep((s) => s - 1)}
                        disabled={currentStep <= 0}
                        className="gap-1.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {ts('firstAid.prevStep')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep((s) => s + 1)}
                        disabled={currentStep >= totalSteps - 1}
                        className="gap-1.5"
                      >
                        {ts('firstAid.nextStep')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
