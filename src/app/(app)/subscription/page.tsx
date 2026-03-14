'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Calendar, AlertTriangle, Crown } from 'lucide-react';
import { format } from 'date-fns';

interface LocalizedText {
  uz: string;
  uzLatin: string;
  ru: string;
}

interface Plan {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  priceInTiyins: number;
  durationDays: number;
  features: LocalizedText[];
}

interface SubscriptionStatus {
  status: string;
  planName: LocalizedText | null;
  expiresAt: string | null;
  autoRenew: boolean;
  subscriptionId?: string;
}

interface InitiatePaymentResult {
  paymentUrl: string;
  transactionId: string;
}

function formatPrice(tiyins: number): string {
  const sum = tiyins / 100;
  return sum.toLocaleString('uz-UZ').replace(/,/g, ' ');
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get<Plan[]>('/subscriptions/plans'),
      apiClient.get<SubscriptionStatus>('/subscriptions/status'),
    ])
      .then(([p, s]) => { setPlans(p); setSubscription(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string, provider: 'payme' | 'click') => {
    setSubscribing(planId);
    try {
      const result = await apiClient.post<InitiatePaymentResult>('/payments/initiate', {
        planId,
        provider,
      });
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      // If no redirect URL, refresh status
      const status = await apiClient.get<SubscriptionStatus>('/subscriptions/status');
      setSubscription(status);
    } catch {
      // error handling
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!subscription?.subscriptionId) return;
    setCancelling(true);
    try {
      await apiClient.delete(`/subscriptions/${subscription.subscriptionId}`);
      const status = await apiClient.get<SubscriptionStatus>('/subscriptions/status');
      setSubscription(status);
      setCancelDialogOpen(false);
    } catch {
      // error handling
    } finally {
      setCancelling(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-3 sm:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-64" />)}</div>
      </div>
    );

  const isActive = subscription?.status === 'active' || subscription?.status === 'Active';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Obuna</h1>
        <p className="text-sm text-muted-foreground mt-1">Obuna rejangizni boshqaring</p>
      </div>

      {/* Current subscription card */}
      <Card className={isActive ? 'border-green-200 dark:border-green-800' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Joriy obuna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isActive ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{subscription?.planName ? t(subscription.planName) : 'Faol reja'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="bg-green-600">Faol</Badge>
                    {subscription?.expiresAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(subscription.expiresAt), 'dd.MM.yyyy')} gacha
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Avtomatik uzaytirish</span>
                </div>
                <Switch
                  checked={subscription?.autoRenew ?? false}
                  onCheckedChange={() => {
                    if (subscription?.autoRenew) setCancelDialogOpen(true);
                  }}
                />
              </div>

              {subscription?.subscriptionId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Obunani bekor qilish
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Hozirda faol obunangiz yo&apos;q</p>
              <p className="text-xs text-muted-foreground mt-1">Quyidagi rejalardan birini tanlang</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Mavjud rejalar</h2>
        <div className={`grid gap-4 ${plans.length <= 2 ? 'sm:grid-cols-2 max-w-2xl' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {plans.map((plan) => {
            const isPopular = plan.durationDays === 30;

            return (
              <Card key={plan.id} className={isPopular ? 'border-primary ring-1 ring-primary/20' : ''}>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{t(plan.name)}</h3>
                      {isPopular && <Badge>Ommabop</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t(plan.description)}</p>
                  </div>

                  <div>
                    <span className="text-2xl font-bold">{formatPrice(plan.priceInTiyins)}</span>
                    <span className="text-sm text-muted-foreground ml-1">so&apos;m</span>
                    <span className="text-xs text-muted-foreground ml-1">/ {plan.durationDays} kun</span>
                  </div>

                  {plan.features.length > 0 && (
                    <ul className="space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                          <span>{t(f)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubscribe(plan.id, 'payme')}
                      disabled={!!subscribing}
                      className="text-xs"
                    >
                      {subscribing === plan.id ? '...' : 'Payme'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSubscribe(plan.id, 'click')}
                      disabled={!!subscribing}
                      className="text-xs"
                    >
                      {subscribing === plan.id ? '...' : 'Click'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Obunani bekor qilish
            </DialogTitle>
            <DialogDescription>
              Obunani bekor qilsangiz, joriy muddat tugaguniga qadar barcha imkoniyatlardan foydalanishingiz mumkin.
              Muddat tugagach, bepul reja cheklovlari qo&apos;llaniladi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              Ortga
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
