'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  Play,
  ChevronRight,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorVisionPlateDto, ColorVisionResultDto } from '@/types/content';

type TestState = 'instructions' | 'testing' | 'result';

interface PlateAnswer {
  plateId: string;
  answer: string;
}

export default function ColorVisionPage() {
  const { t, ts } = useLocale();
  const { isAuthenticated } = useAuthStore();

  const [plates, setPlates] = useState<ColorVisionPlateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [testState, setTestState] = useState<TestState>('instructions');
  const [currentPlate, setCurrentPlate] = useState(0);
  const [answers, setAnswers] = useState<PlateAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [result, setResult] = useState<ColorVisionResultDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPlates = async () => {
      try {
        const data = await apiClient.get<ColorVisionPlateDto[]>('/color-vision/plates');
        setPlates(data);
      } catch (err: any) {
        toast.error(err?.message || ts('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchPlates();
  }, [ts]);

  const startTest = () => {
    setAnswers([]);
    setCurrentPlate(0);
    setCurrentAnswer('');
    setResult(null);
    setSaved(false);
    setTestState('testing');
  };

  const handleNext = () => {
    const updated = [...answers, { plateId: plates[currentPlate].plateId, answer: currentAnswer.trim() }];
    setAnswers(updated);
    setCurrentAnswer('');

    if (currentPlate < plates.length - 1) {
      setCurrentPlate((p) => p + 1);
    } else {
      submitTest(updated);
    }
  };

  const submitTest = async (finalAnswers: PlateAnswer[]) => {
    try {
      const data = await apiClient.post<ColorVisionResultDto>('/color-vision/result', {
        answers: finalAnswers,
      });
      setResult(data);
      setTestState('result');
    } catch (err: any) {
      toast.error(err?.message || ts('common.error'));
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await apiClient.post('/color-vision/result', { answers, save: true });
      setSaved(true);
      toast.success(ts('colorVision.saved'));
    } catch (err: any) {
      toast.error(err?.message || ts('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setTestState('instructions');
    setCurrentPlate(0);
    setAnswers([]);
    setCurrentAnswer('');
    setResult(null);
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (plates.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold tracking-tight">{ts('colorVision.title')}</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <Eye className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{ts('colorVision.noPlates')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState === 'instructions') {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold tracking-tight">{ts('colorVision.title')}</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5" />
              {ts('colorVision.instructionsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ts('colorVision.description')}
            </p>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
                <p className="text-sm">{ts('colorVision.instruction1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
                <p className="text-sm">{ts('colorVision.instruction2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
                <p className="text-sm">{ts('colorVision.instruction3')}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">{ts('colorVision.disclaimer')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {plates.length} {ts('colorVision.plates')}
              </Badge>
            </div>
            <Button onClick={startTest} className="gap-2 w-full sm:w-auto">
              <Play className="h-4 w-4" />
              {ts('colorVision.startTest')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState === 'testing') {
    const plate = plates[currentPlate];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{ts('colorVision.title')}</h1>
          <Badge variant="secondary" className="text-sm">
            {currentPlate + 1}/{plates.length}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex justify-center">
              <img
                src={plate.imageUrl}
                alt={`${ts('colorVision.plates')} ${currentPlate + 1}`}
                className="max-w-full h-auto max-h-72 sm:max-h-80 rounded-xl object-contain"
              />
            </div>

            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${((currentPlate + 1) / plates.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{ts('colorVision.whatDoYouSee')}</label>
              <Input
                placeholder={ts('colorVision.enterNumber')}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentAnswer.trim()) handleNext();
                }}
                autoFocus
                className="text-center text-lg"
              />
            </div>

            <Button
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
              className="gap-2 w-full"
            >
              {currentPlate < plates.length - 1 ? (
                <>
                  {ts('colorVision.nextPlate')}
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                ts('colorVision.result')
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result state
  const passed = result?.passed ?? false;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">{ts('colorVision.title')}</h1>

      <Card className={cn(
        'border-2',
        passed
          ? 'border-green-300 dark:border-green-700'
          : 'border-amber-300 dark:border-amber-700'
      )}>
        <CardContent className="p-6 text-center space-y-4">
          <div className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
            passed
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          )}>
            {passed ? (
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            )}
          </div>

          <div>
            <h2 className={cn(
              'text-lg font-bold',
              passed
                ? 'text-green-700 dark:text-green-400'
                : 'text-amber-700 dark:text-amber-400'
            )}>
              {passed ? ts('colorVision.passed') : ts('colorVision.failed')}
            </h2>
            <p className="text-2xl font-bold mt-1">
              {ts('colorVision.score')}: {result?.score ?? 0}/{result?.total ?? 0}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" onClick={handleRetry} className="gap-2 w-full sm:w-auto">
              <RotateCcw className="h-4 w-4" />
              {ts('colorVision.retryTest')}
            </Button>
            {isAuthenticated ? (
              <Button
                onClick={handleSave}
                disabled={saving || saved}
                className="gap-2 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving
                  ? ts('colorVision.saving')
                  : saved
                    ? ts('colorVision.saved')
                    : ts('colorVision.saveResult')}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">{ts('colorVision.loginToSave')}</p>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-left">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">{ts('colorVision.disclaimer')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
