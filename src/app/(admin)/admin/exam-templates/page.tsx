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
import { useLocale } from '@/hooks/use-locale';

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
  totalQuestions: number;
  timeLimitMinutes: number;
  passingScore: number;
  poolRules: PoolRuleDto[];
}

const emptyForm: TemplateFormState = {
  name: '',
  totalQuestions: 20,
  timeLimitMinutes: 25,
  passingScore: 18,
  poolRules: [],
};

export default function ExamTemplatesPage() {
  const { language } = useLocaleStore();
  const { ts } = useLocale();
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
      toast.error(err instanceof Error ? err.message : ts('admin.examTemplates.loadError'));
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
      .catch(() => toast.error(ts('admin.examTemplates.categoriesLoadError')));
  }, [lang]);

  const poolRulesSum = form.poolRules.reduce((sum, r) => sum + r.questionCount, 0);
  const isPoolValid = poolRulesSum === form.totalQuestions;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const getTemplateName = (t: ExamTemplateDto) => {
    if (lang === 'uz') return t.titleUz;
    if (lang === 'ru') return t.titleRu;
    return t.titleUzLatin;
  };

  const openEditDialog = (template: ExamTemplateDto) => {
    setEditingId(template.id);
    setForm({
      name: getTemplateName(template),
      totalQuestions: template.totalQuestions,
      timeLimitMinutes: template.timeLimitMinutes,
      passingScore: template.passingScore,
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
      toast.error(ts('admin.examTemplates.nameRequired'));
      return;
    }
    if (form.totalQuestions < 1) {
      toast.error(ts('admin.examTemplates.minQuestions'));
      return;
    }
    if (form.poolRules.length > 0 && !isPoolValid) {
      toast.error(
        ts('admin.examTemplates.poolSumError')
          .replace('{sum}', String(poolRulesSum))
          .replace('{total}', String(form.totalQuestions))
      );
      return;
    }
    if (form.poolRules.some((r) => !r.categoryId)) {
      toast.error(ts('admin.examTemplates.poolCategoryRequired'));
      return;
    }

    setSaving(true);
    try {
      const trimmedName = form.name.trim();
      const payload = {
        titleUz: trimmedName,
        titleUzLatin: trimmedName,
        titleRu: trimmedName,
        totalQuestions: form.totalQuestions,
        passingScore: form.passingScore,
        timeLimitMinutes: form.timeLimitMinutes,
        isActive: true,
        poolRules: form.poolRules.map((r) => ({
          categoryId: r.categoryId,
          questionCount: r.questionCount,
        })),
      };

      if (editingId) {
        await apiClient.put(`/admin/exam-templates/${editingId}`, payload);
        toast.success(ts('admin.examTemplates.updated'));
      } else {
        await apiClient.post('/admin/exam-templates', payload);
        toast.success(ts('admin.examTemplates.created'));
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.examTemplates.saveError'));
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
          <h1 className="text-xl font-bold tracking-tight">{ts('admin.examTemplates.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {ts('admin.examTemplates.totalCount').replace('{count}', String(templates.length))}
          </p>
        </div>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.examTemplates.addBtn')}
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-sm text-muted-foreground">{ts('admin.examTemplates.notFound')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{getTemplateName(template)}</CardTitle>
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
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{template.totalQuestions}</span>
                    <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70">{ts('admin.examTemplates.questionLabel')}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 p-2.5 dark:bg-amber-950/30">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{template.timeLimitMinutes}</span>
                    <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">{ts('admin.examTemplates.minuteLabel')}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-green-50 p-2.5 dark:bg-green-950/30">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">{template.passingScore}</span>
                    <span className="text-[10px] text-green-600/70 dark:text-green-400/70">{ts('admin.examTemplates.passLabel')}</span>
                  </div>
                </div>

                {template.poolRules.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{ts('admin.examTemplates.poolRules')}</p>
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
              {editingId ? ts('admin.examTemplates.editTitle') : ts('admin.examTemplates.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="tmpl-name">{ts('admin.plans.nameSection')}</Label>
              <Input
                id="tmpl-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={ts('admin.examTemplates.namePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tmpl-qcount">{ts('admin.examTemplates.questionCount')}</Label>
                <Input
                  id="tmpl-qcount"
                  type="number"
                  min={1}
                  value={form.totalQuestions}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, totalQuestions: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmpl-duration">{ts('admin.examTemplates.duration')}</Label>
                <Input
                  id="tmpl-duration"
                  type="number"
                  min={1}
                  value={form.timeLimitMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, timeLimitMinutes: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmpl-pass">{ts('admin.examTemplates.passScore')}</Label>
                <Input
                  id="tmpl-pass"
                  type="number"
                  min={0}
                  max={form.totalQuestions}
                  value={form.passingScore}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, passingScore: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{ts('admin.examTemplates.poolRules')}</Label>
                <Button variant="outline" size="sm" onClick={addPoolRule}>
                  <Plus className="h-3 w-3" />
                  {ts('admin.examTemplates.addRule')}
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
                          <SelectValue placeholder={ts('admin.examTemplates.selectCategory')} />
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
                        {`${ts('common.total')}: ${poolRulesSum} / ${form.totalQuestions}`}
                      </span>
                      {isPoolValid ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {ts('admin.examTemplates.poolCorrect')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {poolRulesSum > form.totalQuestions ? ts('admin.examTemplates.poolExcess') : ts('admin.examTemplates.poolInsufficient')}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={form.totalQuestions > 0 ? Math.min((poolRulesSum / form.totalQuestions) * 100, 100) : 0}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? ts('admin.saving') : editingId ? ts('admin.updateBtn') : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
