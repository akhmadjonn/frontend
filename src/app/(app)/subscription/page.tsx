'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Check, Calendar, AlertTriangle, Crown, ChevronRight } from 'lucide-react';
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

interface PaymentMethods {
  paymeEnabled: boolean;
  clickEnabled: boolean;
}

function formatPrice(tiyins: number): string {
  const sum = tiyins / 100;
  return sum.toLocaleString('uz-UZ').replace(/,/g, ' ');
}

export default function SubscriptionPage() {
  const { t, ts } = useLocale();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({ paymeEnabled: true, clickEnabled: true });
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<Plan[]>('/subscriptions/plans'),
      apiClient.get<SubscriptionStatus>('/subscriptions/status'),
      apiClient.get<PaymentMethods>('/payments/methods'),
    ])
      .then(([p, s, m]) => { setPlans(p); setSubscription(s); setPaymentMethods(m); })
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
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );

  const isActive = subscription?.status === 'active' || subscription?.status === 'Active';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('subscription.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('subscription.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          {isActive ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{subscription?.planName ? t(subscription.planName) : ts('subscription.activePlan')}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-green-700 dark:text-green-400">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {ts('subscription.active')}
                    </span>
                    {subscription?.expiresAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(subscription.expiresAt), 'dd.MM.yyyy')} {ts('subscription.until')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">{ts('subscription.autoRenewShort')}</span>
                <Switch
                  checked={subscription?.autoRenew ?? false}
                  onCheckedChange={() => {
                    if (subscription?.autoRenew) setCancelDialogOpen(true);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Crown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{ts('subscription.noActivePlan')}</p>
                <p className="text-xs text-muted-foreground">{ts('subscription.choosePlan')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {plans.map((plan) => {
          const isPopular = plan.durationDays === 30;
          const isExpanded = expandedPlan === plan.id;
          const perDay = Math.round(plan.priceInTiyins / plan.durationDays / 100);
          const accent = plan.durationDays <= 7
            ? 'border-l-blue-500'
            : plan.durationDays <= 30
              ? 'border-l-violet-500'
              : 'border-l-emerald-500';

          return (
            <Card
              key={plan.id}
              className={`relative overflow-visible border-l-[3px] ${accent} ${isPopular ? 'border-foreground border-l-violet-500' : ''}`}
            >
              {isPopular && (
                <span className="absolute -top-2.5 left-4 bg-violet-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                  {ts('subscription.popular')}
                </span>
              )}
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="shrink-0 w-28 sm:w-36">
                    <h3 className="text-sm font-bold">{t(plan.name)}</h3>
                    <div className="mt-1">
                      <span className="text-2xl font-extrabold tracking-tight">{formatPrice(plan.priceInTiyins)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ts('common.sum')} / {plan.durationDays} {ts('common.days')}</p>
                    <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium mt-0.5">~{perDay.toLocaleString()} {ts('common.perDay')}</p>
                  </div>

                  <div className="hidden sm:flex flex-1 items-center gap-x-4 gap-y-1 flex-wrap">
                    {plan.features.map((f, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        {t(f)}
                      </span>
                    ))}
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {paymentMethods.paymeEnabled && (
                      <Button
                        size="sm"
                        onClick={() => handleSubscribe(plan.id, 'payme')}
                        disabled={!!subscribing}
                      >
                        {subscribing === plan.id ? '...' : 'Payme'}
                      </Button>
                    )}
                    {paymentMethods.clickEnabled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubscribe(plan.id, 'click')}
                        disabled={!!subscribing}
                      >
                        {subscribing === plan.id ? '...' : 'Click'}
                      </Button>
                    )}
                  </div>

                  <button
                    className="sm:hidden ml-auto shrink-0 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  >
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="sm:hidden border-t px-4 pb-4 pt-3 space-y-3">
                    {plan.features.length > 0 && (
                      <ul className="space-y-1.5">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                            {t(f)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className={`grid gap-2 ${paymentMethods.paymeEnabled && paymentMethods.clickEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {paymentMethods.paymeEnabled && (
                        <Button
                          size="sm"
                          onClick={() => handleSubscribe(plan.id, 'payme')}
                          disabled={!!subscribing}
                        >
                          {subscribing === plan.id ? '...' : 'Payme'}
                        </Button>
                      )}
                      {paymentMethods.clickEnabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubscribe(plan.id, 'click')}
                          disabled={!!subscribing}
                        >
                          {subscribing === plan.id ? '...' : 'Click'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isActive && subscription?.subscriptionId && (
        <div className="pt-2">
          <button
            onClick={() => setCancelDialogOpen(true)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            {ts('subscription.cancelSubscription')}
          </button>
        </div>
      )}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {ts('subscription.cancelSubscription')}
            </DialogTitle>
            <DialogDescription>
              {ts('subscription.cancelConfirm')}
              {' '}{ts('subscription.cancelExplanation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              {ts('subscription.goBack')}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? ts('subscription.cancelling') : ts('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
