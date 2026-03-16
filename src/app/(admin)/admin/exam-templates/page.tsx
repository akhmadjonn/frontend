'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ExamTemplateDto, PoolRuleDto, CategoryDto, LocalizedText } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle, AlertCircle, FileQuestion, Clock, Target } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';

interface FlatCategory {
  id: string;
  name: string;
}

function flattenCategories(categories: CategoryDto[], language: keyof LocalizedText): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    result.push({
      id: cat.id,
      name: cat.name[language] || cat.name.uzLatin,
    });
    if (cat.children?.length)
      result.push(...flattenCategories(cat.children, language));
  }
  return result;
}

interface TemplateFormState {
  name: string;
  questionCount: number;
  durationMinutes: number;
  passScore: number;
  poolRules: PoolRuleDto[];
}

const emptyForm: TemplateFormState = {
  name: '',
  questionCount: 20,
  durationMinutes: 25,
  passScore: 18,
  poolRules: [],
};

export default function ExamTemplatesPage() {
  const { language } = useLocaleStore();
  const lang = language as keyof LocalizedText;

  const [templates, setTemplates] = useState<ExamTemplateDto[]>([]);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormState>(emptyForm);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<ExamTemplateDto[]>('/admin/exam-templates');
      setTemplates(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Shablonlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    apiClient
      .get<CategoryDto[]>('/categories')
      .then((data) => setCategories(flattenCategories(data, lang)))
      .catch(() => toast.error('Kategoriyalarni yuklashda xatolik'));
  }, [lang]);

  const poolRulesSum = form.poolRules.reduce((sum, r) => sum + r.questionCount, 0);
  const isPoolValid = poolRulesSum === form.questionCount;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (template: ExamTemplateDto) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      questionCount: template.questionCount,
      durationMinutes: template.durationMinutes,
      passScore: template.passScore,
      poolRules: template.poolRules.map((r) => ({ ...r })),
    });
    setDialogOpen(true);
  };

  const addPoolRule = () => {
    setForm((prev) => ({
      ...prev,
      poolRules: [...prev.poolRules, { categoryId: '', questionCount: 1 }],
    }));
  };

  const removePoolRule = (index: number) => {
    setForm((prev) => ({
      ...prev,
      poolRules: prev.poolRules.filter((_, i) => i !== index),
    }));
  };

  const updatePoolRule = (index: number, field: keyof PoolRuleDto, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      poolRules: prev.poolRules.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Shablon nomini kiriting');
      return;
    }
    if (form.questionCount < 1) {
      toast.error('Savollar soni kamida 1 bo\'lishi kerak');
      return;
    }
    if (form.poolRules.length > 0 && !isPoolValid) {
      toast.error(`Pool qoidalari yig'indisi (${poolRulesSum}) savollar soniga (${form.questionCount}) teng bo'lishi kerak`);
      return;
    }
    if (form.poolRules.some((r) => !r.categoryId)) {
      toast.error('Barcha pool qoidalari uchun kategoriya tanlang');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        questionCount: form.questionCount,
        durationMinutes: form.durationMinutes,
        passScore: form.passScore,
        poolRules: form.poolRules,
      };

      if (editingId) {
        await apiClient.put(`/admin/exam-templates/${editingId}`, payload);
        toast.success('Shablon yangilandi');
      } else {
        await apiClient.post('/admin/exam-templates', payload);
        toast.success('Shablon yaratildi');
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name ?? categoryId;
  };

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Imtihon shablonlari</h1>
          <p className="text-sm text-muted-foreground">
            Jami: {templates.length} ta shablon
          </p>
        </div>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Shablon qo&apos;shish
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-sm text-muted-foreground">Shablonlar topilmadi</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-blue-50 p-2.5 dark:bg-blue-950/30">
                    <FileQuestion className="h-4 w-4 text-blue-500" />
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{template.questionCount}</span>
                    <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70">savol</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 p-2.5 dark:bg-amber-950/30">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{template.durationMinutes}</span>
                    <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">daqiqa</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-green-50 p-2.5 dark:bg-green-950/30">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">{template.passScore}</span>
                    <span className="text-[10px] text-green-600/70 dark:text-green-400/70">o&apos;tish</span>
                  </div>
                </div>

                {template.poolRules.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Pool qoidalari</p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.poolRules.map((rule, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {rule.categoryName ?? getCategoryName(rule.categoryId)}: {rule.questionCount}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Shablonni tahrirlash' : 'Yangi shablon yaratish'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="tmpl-name">Nomi</Label>
              <Input
                id="tmpl-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Standart imtihon"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tmpl-qcount">Savollar soni</Label>
                <Input
                  id="tmpl-qcount"
                  type="number"
                  min={1}
                  value={form.questionCount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, questionCount: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmpl-duration">Vaqt (daq.)</Label>
                <Input
                  id="tmpl-duration"
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmpl-pass">O&apos;tish bali</Label>
                <Input
                  id="tmpl-pass"
                  type="number"
                  min={0}
                  max={form.questionCount}
                  value={form.passScore}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, passScore: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pool qoidalari</Label>
                <Button variant="outline" size="sm" onClick={addPoolRule}>
                  <Plus className="h-3 w-3" />
                  Qo&apos;shish
                </Button>
              </div>

              {form.poolRules.length > 0 && (
                <div className="space-y-2">
                  {form.poolRules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={rule.categoryId}
                        onValueChange={(val) => updatePoolRule(index, 'categoryId', val ?? '')}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Kategoriya tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={rule.questionCount}
                        onChange={(e) =>
                          updatePoolRule(index, 'questionCount', Number(e.target.value) || 0)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removePoolRule(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Jami: {poolRulesSum} / {form.questionCount}
                      </span>
                      {isPoolValid ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          To&apos;g&apos;ri
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {poolRulesSum > form.questionCount ? 'Ortiqcha' : 'Yetarli emas'}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={form.questionCount > 0 ? Math.min((poolRulesSum / form.questionCount) * 100, 100) : 0}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : editingId ? 'Yangilash' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
