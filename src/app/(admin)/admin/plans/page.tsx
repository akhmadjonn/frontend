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
import { Plus, Pencil, CreditCard } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';

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
    features: plan.features,
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
      toast.error(err instanceof Error ? err.message : 'Rejalarni yuklashda xatolik');
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
      toast.error('Reja nomi (UZ Lotin) kiritilishi shart');
      return;
    }

    const priceNumber = Number(form.priceUzs);
    if (!priceNumber || priceNumber <= 0) {
      toast.error('Narx musbat son bo\'lishi kerak');
      return;
    }

    const durationNumber = Number(form.durationDays);
    if (!durationNumber || durationNumber <= 0) {
      toast.error('Davomiylik musbat son bo\'lishi kerak');
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
        features: form.features,
        isActive: form.isActive,
      };

      if (editingPlan) {
        await apiClient.put(`/admin/plans/${editingPlan.id}`, payload);
        toast.success('Reja yangilandi');
      } else {
        await apiClient.post('/admin/plans', payload);
        toast.success('Reja yaratildi');
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik yuz berdi');
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
      toast.success(plan.isActive ? 'Reja o\'chirildi' : 'Reja faollashtirildi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Holatni o\'zgartirishda xatolik');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Obuna rejalari</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Reja qo&apos;shish
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
              Hozircha rejalar mavjud emas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const features = plan.features
              ? plan.features.split(',').map((f) => f.trim()).filter(Boolean)
              : [];

            return (
              <Card key={plan.id} className="relative flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      {getPlanName(plan, language)}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatMoney(plan.priceInTiyins)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {plan.durationDays} kun
                    </p>
                  </div>

                  {getPlanDescription(plan, language) && (
                    <p className="text-sm text-muted-foreground">
                      {getPlanDescription(plan, language)}
                    </p>
                  )}

                  {features.length > 0 && (
                    <ul className="space-y-1.5 flex-1">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">&#10003;</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => handleToggleStatus(plan)}
                        disabled={togglingId === plan.id}
                        size="sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        {plan.isActive ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(plan)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Tahrirlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Rejani tahrirlash' : 'Yangi reja qo\'shish'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Nomi</p>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="nameUzLatin">UZ Lotin</Label>
                  <Input
                    id="nameUzLatin"
                    value={form.nameUzLatin}
                    onChange={(e) => updateField('nameUzLatin', e.target.value)}
                    placeholder="Reja nomi (lotin)"
                  />
                </div>
                <div>
                  <Label htmlFor="nameUz">UZ Kirill</Label>
                  <Input
                    id="nameUz"
                    value={form.nameUz}
                    onChange={(e) => updateField('nameUz', e.target.value)}
                    placeholder="Режа номи (кирилл)"
                  />
                </div>
                <div>
                  <Label htmlFor="nameRu">Русский</Label>
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
              <p className="text-sm font-medium text-muted-foreground">Tavsif</p>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="descUzLatin">UZ Lotin</Label>
                  <Textarea
                    id="descUzLatin"
                    value={form.descriptionUzLatin}
                    onChange={(e) => updateField('descriptionUzLatin', e.target.value)}
                    placeholder="Tavsif (lotin)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="descUz">UZ Kirill</Label>
                  <Textarea
                    id="descUz"
                    value={form.descriptionUz}
                    onChange={(e) => updateField('descriptionUz', e.target.value)}
                    placeholder="Тавсиф (кирилл)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="descRu">Русский</Label>
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
                <Label htmlFor="priceUzs">Narx (UZS)</Label>
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
                <Label htmlFor="durationDays">Davomiylik (kun)</Label>
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
              <Label htmlFor="features">Xususiyatlar (vergul bilan ajratilgan)</Label>
              <Textarea
                id="features"
                value={form.features}
                onChange={(e) => updateField('features', e.target.value)}
                placeholder="Barcha savollar, Cheksiz imtihonlar, Statistika"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(val) => updateField('isActive', val as boolean)}
              />
              <Label>Faol holat</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Saqlanmoqda...'
                : editingPlan
                  ? 'Saqlash'
                  : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
