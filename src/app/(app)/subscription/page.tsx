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
import { Check, Calendar, AlertTriangle, Crown, ChevronRight, Sparkles, Shield, Zap } from 'lucide-react';
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

const PLAN_ICONS = [Zap, Sparkles, Shield];

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
      <div className="space-y-4 max-w-2xl animate-fade-up">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );

  const isActive = subscription?.status === 'active' || subscription?.status === 'Active';

  const planAccents = [
    { bg: 'from-blue-50 to-blue-50/30', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    { bg: 'from-violet-50 to-purple-50/30', border: 'border-violet-300', icon: 'bg-violet-100 text-violet-600', badge: 'bg-violet-100 text-violet-700' },
    { bg: 'from-emerald-50 to-teal-50/30', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="space-y-6 max-w-2xl animate-fade-up">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{ts('subscription.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{ts('subscription.subtitle')}</p>
      </div>

      {/* Current subscription status */}
      <Card className="rounded-2xl overflow-hidden border-border/50">
        <CardContent className="p-0">
          {isActive ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold">{subscription?.planName ? t(subscription.planName) : ts('subscription.activePlan')}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/80">
                  <Crown className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-base font-semibold">{ts('subscription.noActivePlan')}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{ts('subscription.choosePlan')}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan, idx) => {
          const isPopular = plan.durationDays === 30;
          const isExpanded = expandedPlan === plan.id;
          const perDay = Math.round(plan.priceInTiyins / plan.durationDays / 100);
          const accent = planAccents[idx % planAccents.length];
          const PlanIcon = PLAN_ICONS[idx % PLAN_ICONS.length];
          // Check if this is the user's current active plan
          const isCurrentPlan = isActive && subscription?.planName && t(subscription.planName) === t(plan.name);
          const canPurchase = !isCurrentPlan && !subscribing;

          return (
            <Card
              key={plan.id}
              className={`relative overflow-visible rounded-2xl transition-all duration-200 ${
                isPopular
                  ? 'ring-2 ring-violet-300 shadow-lg shadow-violet-100/50'
                  : 'border-border/50 hover:shadow-md'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md">
                  {ts('subscription.popular')}
                </span>
              )}
              <CardContent className="p-0">
                {/* Plan content */}
                <div className={`p-5 sm:p-6 ${isPopular ? 'bg-gradient-to-br from-violet-50/50 to-white' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`hidden sm:flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${accent.icon}`}>
                      <PlanIcon className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h3 className="text-base font-bold">{t(plan.name)}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${accent.badge}`}>
                          {plan.durationDays} {ts('common.days')}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold tracking-tight tabular-nums">{formatPrice(plan.priceInTiyins)}</span>
                        <span className="text-sm text-muted-foreground">{ts('common.sum')}</span>
                      </div>
                      <p className="text-xs text-[oklch(0.588_0.158_241)] font-medium mt-0.5">~{perDay.toLocaleString()} {ts('common.perDay')}</p>

                      {/* Features — desktop */}
                      <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
                        {plan.features.map((f, i) => (
                          <span key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                            <Check className="h-4 w-4 text-[oklch(0.588_0.158_241)] shrink-0" />
                            {t(f)}
                          </span>
                        ))}
                      </div>

                      {/* Payment buttons — desktop */}
                      <div className="hidden sm:flex items-center gap-2.5 mt-5">
                        {isCurrentPlan ? (
                          <span className="inline-flex items-center gap-2 rounded-xl h-10 px-5 bg-emerald-100 text-emerald-700 font-semibold text-sm">
                            <Check className="h-4 w-4" />
                            {ts('subscription.currentPlan')}
                          </span>
                        ) : (
                          <>
                            <Button
                              onClick={() => paymentMethods.paymeEnabled && handleSubscribe(plan.id, 'payme')}
                              disabled={!canPurchase || !paymentMethods.paymeEnabled}
                              className="rounded-xl h-10 px-5 bg-[#00CCCC] hover:bg-[#00B3B3] text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {subscribing === plan.id ? '...' : '💳 Payme'}
                            </Button>
                            <Button
                              onClick={() => paymentMethods.clickEnabled && handleSubscribe(plan.id, 'click')}
                              disabled={!canPurchase || !paymentMethods.clickEnabled}
                              className="rounded-xl h-10 px-5 bg-[#0065FF] hover:bg-[#0052CC] text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {subscribing === plan.id ? '...' : '💳 Click'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile expand */}
                    <button
                      className="sm:hidden ml-auto shrink-0 flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted/60 transition-colors"
                      onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                    >
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Mobile expanded content */}
                  {isExpanded && (
                    <div className="sm:hidden mt-4 pt-4 border-t border-border/50 space-y-4">
                      {plan.features.length > 0 && (
                        <ul className="space-y-2">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                              <Check className="h-4 w-4 text-[oklch(0.588_0.158_241)] shrink-0" />
                              {t(f)}
                            </li>
                          ))}
                        </ul>
                      )}
                      {isCurrentPlan ? (
                        <div className="flex justify-center">
                          <span className="inline-flex items-center gap-2 rounded-xl h-11 px-6 bg-emerald-100 text-emerald-700 font-semibold text-sm">
                            <Check className="h-4 w-4" />
                            {ts('subscription.currentPlan')}
                          </span>
                        </div>
                      ) : (
                        <div className="grid gap-2.5 grid-cols-2">
                          <Button
                            onClick={() => paymentMethods.paymeEnabled && handleSubscribe(plan.id, 'payme')}
                            disabled={!canPurchase || !paymentMethods.paymeEnabled}
                            className="rounded-xl h-11 bg-[#00CCCC] hover:bg-[#00B3B3] text-white font-semibold disabled:opacity-50"
                          >
                            {subscribing === plan.id ? '...' : '💳 Payme'}
                          </Button>
                          <Button
                            onClick={() => paymentMethods.clickEnabled && handleSubscribe(plan.id, 'click')}
                            disabled={!canPurchase || !paymentMethods.clickEnabled}
                            className="rounded-xl h-11 bg-[#0065FF] hover:bg-[#0052CC] text-white font-semibold disabled:opacity-50"
                          >
                            {subscribing === plan.id ? '...' : '💳 Click'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cancel subscription button */}
      {isActive && subscription?.subscriptionId && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCancelDialogOpen(true)}
            className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            {ts('subscription.cancelSubscription')}
          </Button>
        </div>
      )}

      {/* Cancel dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              {ts('subscription.cancelSubscription')}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {ts('subscription.cancelConfirm')}
              {' '}{ts('subscription.cancelExplanation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling} className="rounded-xl">
              {ts('subscription.goBack')}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling} className="rounded-xl">
              {cancelling ? ts('subscription.cancelling') : ts('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
