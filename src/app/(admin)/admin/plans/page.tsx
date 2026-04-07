'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AdminPlanDto } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, CreditCard, Check, Clock, Sparkles } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';

const formatMoney = (tiyins: number) =>
  `${(tiyins / 100).toLocaleString('uz-UZ')} so'm`;

interface PlanFormData {
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  priceUzs: string;
  durationDays: string;
  features: string;
  isActive: boolean;
}

const emptyForm: PlanFormData = {
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  priceUzs: '',
  durationDays: '',
  features: '',
  isActive: true,
};

function formFromPlan(plan: AdminPlanDto): PlanFormData {
  return {
    nameUz: plan.nameUz,
    nameUzLatin: plan.nameUzLatin,
    nameRu: plan.nameRu,
    descriptionUz: plan.descriptionUz,
    descriptionUzLatin: plan.descriptionUzLatin,
    descriptionRu: plan.descriptionRu,
    priceUzs: String(plan.priceInTiyins / 100),
    durationDays: String(plan.durationDays),
    features: (() => {
      try {
        const parsed = JSON.parse(plan.features);
        return Array.isArray(parsed) ? parsed.join(', ') : plan.features;
      } catch {
        return plan.features;
      }
    })(),
    isActive: plan.isActive,
  };
}

function getPlanName(plan: AdminPlanDto, language: string) {
  if (language === 'uz') return plan.nameUz;
  if (language === 'ru') return plan.nameRu;
  return plan.nameUzLatin;
}

function getPlanDescription(plan: AdminPlanDto, language: string) {
  if (language === 'uz') return plan.descriptionUz;
  if (language === 'ru') return plan.descriptionRu;
  return plan.descriptionUzLatin;
}

export default function PlansPage() {
  const { language } = useLocaleStore();
  const { ts } = useLocale();
  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlanDto | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<AdminPlanDto[]>('/admin/plans');
      setPlans(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.plans.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreateDialog = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (plan: AdminPlanDto) => {
    setEditingPlan(plan);
    setForm(formFromPlan(plan));
    setDialogOpen(true);
  };

  const updateField = <K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nameUzLatin.trim()) {
      toast.error(ts('admin.plans.nameRequired'));
      return;
    }

    const priceNumber = Number(form.priceUzs);
    if (!priceNumber || priceNumber <= 0) {
      toast.error(ts('admin.plans.pricePositive'));
      return;
    }

    const durationNumber = Number(form.durationDays);
    if (!durationNumber || durationNumber <= 0) {
      toast.error(ts('admin.plans.durationPositive'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nameUz: form.nameUz,
        nameUzLatin: form.nameUzLatin,
        nameRu: form.nameRu,
        descriptionUz: form.descriptionUz,
        descriptionUzLatin: form.descriptionUzLatin,
        descriptionRu: form.descriptionRu,
        priceInTiyins: Math.round(priceNumber * 100),
        durationDays: durationNumber,
        features: JSON.stringify(form.features.split(',').map((f) => f.trim()).filter(Boolean)),
        isActive: form.isActive,
      };

      if (editingPlan) {
        await apiClient.put(`/admin/plans/${editingPlan.id}`, payload);
        toast.success(ts('admin.plans.updated'));
      } else {
        await apiClient.post('/admin/plans', payload);
        toast.success(ts('admin.plans.created'));
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: AdminPlanDto) => {
    setTogglingId(plan.id);
    try {
      await apiClient.patch(`/admin/plans/${plan.id}/status`, { isActive: !plan.isActive });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p))
      );
      toast.success(plan.isActive ? ts('admin.plans.disabled') : ts('admin.plans.enabled'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.plans.statusError'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.plans.title')}</h1>
        <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.plans.addPlan')}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !plans.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {ts('admin.plans.noPlans')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => {
            let features: string[] = [];
            if (plan.features) {
              try {
                const parsed = JSON.parse(plan.features);
                features = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
              } catch {
                features = plan.features.split(',').map((f) => f.trim()).filter(Boolean);
              }
            }
            const isPopular = index === 1 && plans.length > 1;
            const tierColors = [
              'border-t-blue-500',
              'border-t-amber-500',
              'border-t-purple-500',
            ];

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col overflow-visible border-t-4 card-hover ${tierColors[index % 3]} ${
                  isPopular ? 'ring-2 ring-amber-400/50 shadow-lg' : ''
                } ${!plan.isActive ? 'opacity-60' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      {ts('admin.plans.popular')}
                    </span>
                  </div>
                )}

                <CardHeader className={`pb-2 ${isPopular ? 'pt-7' : 'pt-5'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-bold">
                      {getPlanName(plan, language)}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(plan)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-5">
                  <div>
                    <p className="text-3xl font-extrabold tracking-tight">
                      {formatMoney(plan.priceInTiyins)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {plan.durationDays} {ts('admin.plans.days')}
                      </span>
                    </div>
                  </div>

                  {getPlanDescription(plan, language) && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getPlanDescription(plan, language)}
                    </p>
                  )}

                  {features.length > 0 && (
                    <ul className="space-y-2.5 flex-1">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => handleToggleStatus(plan)}
                        disabled={togglingId === plan.id}
                        size="sm"
                      />
                      <span className={`text-xs font-medium ${plan.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        {plan.isActive ? ts('admin.active') : ts('admin.inactive')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? ts('admin.plans.editTitle') : ts('admin.plans.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{ts('admin.plans.nameSection')}</p>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="nameUzLatin">{ts('admin.langUzLatin')}</Label>
                  <Input
                    id="nameUzLatin"
                    value={form.nameUzLatin}
                    onChange={(e) => updateField('nameUzLatin', e.target.value)}
                    placeholder={ts('admin.plans.namePlaceholderLatin')}
                  />
                </div>
                <div>
                  <Label htmlFor="nameUz">{ts('admin.langUzCyrillic')}</Label>
                  <Input
                    id="nameUz"
                    value={form.nameUz}
                    onChange={(e) => updateField('nameUz', e.target.value)}
                    placeholder="Режа номи (кирилл)"
                  />
                </div>
                <div>
                  <Label htmlFor="nameRu">{ts('admin.langRussian')}</Label>
                  <Input
                    id="nameRu"
                    value={form.nameRu}
                    onChange={(e) => updateField('nameRu', e.target.value)}
                    placeholder="Название плана"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{ts('admin.plans.descSection')}</p>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="descUzLatin">{ts('admin.langUzLatin')}</Label>
                  <Textarea
                    id="descUzLatin"
                    value={form.descriptionUzLatin}
                    onChange={(e) => updateField('descriptionUzLatin', e.target.value)}
                    placeholder="Tavsif (lotin)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="descUz">{ts('admin.langUzCyrillic')}</Label>
                  <Textarea
                    id="descUz"
                    value={form.descriptionUz}
                    onChange={(e) => updateField('descriptionUz', e.target.value)}
                    placeholder="Тавсиф (кирилл)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="descRu">{ts('admin.langRussian')}</Label>
                  <Textarea
                    id="descRu"
                    value={form.descriptionRu}
                    onChange={(e) => updateField('descriptionRu', e.target.value)}
                    placeholder="Описание плана"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="priceUzs">{ts('admin.plans.price')}</Label>
                <Input
                  id="priceUzs"
                  type="number"
                  min="0"
                  step="100"
                  value={form.priceUzs}
                  onChange={(e) => updateField('priceUzs', e.target.value)}
                  placeholder="25 000"
                />
              </div>
              <div>
                <Label htmlFor="durationDays">{ts('admin.plans.duration')}</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  value={form.durationDays}
                  onChange={(e) => updateField('durationDays', e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">{ts('admin.plans.features')}</Label>
              <Textarea
                id="features"
                value={form.features}
                onChange={(e) => updateField('features', e.target.value)}
                placeholder={ts('admin.plans.featuresPlaceholder')}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(val) => updateField('isActive', val as boolean)}
              />
              <Label>{ts('admin.activeState')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {submitting
                ? ts('admin.saving')
                : editingPlan
                  ? ts('admin.saveBtn')
                  : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
