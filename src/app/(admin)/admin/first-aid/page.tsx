'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  FirstAidProcedureListDto,
  FirstAidProcedureDto,
  FirstAidStepDto,
  LocalizedText,
} from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, HeartPulse, GripVertical, X } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface StepFormData {
  id?: string;
  stepOrder: number;
  titleUz: string;
  titleUzLatin: string;
  titleRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  imageUrl: string;
}

interface ProcedureFormData {
  slug: string;
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  summaryUz: string;
  summaryUzLatin: string;
  summaryRu: string;
  sortOrder: string;
  iconUrl: string;
  steps: StepFormData[];
}

const emptyStep = (order: number): StepFormData => ({
  stepOrder: order,
  titleUz: '',
  titleUzLatin: '',
  titleRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  imageUrl: '',
});

const emptyForm: ProcedureFormData = {
  slug: '',
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  summaryUz: '',
  summaryUzLatin: '',
  summaryRu: '',
  sortOrder: '0',
  iconUrl: '',
  steps: [emptyStep(1)],
};

function formFromProcedure(proc: FirstAidProcedureDto): ProcedureFormData {
  return {
    slug: proc.slug,
    nameUz: proc.name.uz,
    nameUzLatin: proc.name.uzLatin,
    nameRu: proc.name.ru,
    summaryUz: proc.summary?.uz ?? '',
    summaryUzLatin: proc.summary?.uzLatin ?? '',
    summaryRu: proc.summary?.ru ?? '',
    sortOrder: String(proc.sortOrder),
    iconUrl: proc.iconUrl ?? '',
    steps: proc.steps.map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      titleUz: s.title.uz,
      titleUzLatin: s.title.uzLatin,
      titleRu: s.title.ru,
      descriptionUz: s.description.uz,
      descriptionUzLatin: s.description.uzLatin,
      descriptionRu: s.description.ru,
      imageUrl: s.imageUrl ?? '',
    })),
  };
}

export default function FirstAidPage() {
  const { language } = useLocaleStore();
  const { t, ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const [procedures, setProcedures] = useState<FirstAidProcedureListDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<FirstAidProcedureDto | null>(null);
  const [form, setForm] = useState<ProcedureFormData>(emptyForm);
  // Icon file is staged separately from form state — uploaded after the
  // PUT/POST succeeds via the dedicated /icon endpoint.
  const [iconFile, setIconFile] = useState<File | null>(null);
  // Per-step image files: index → File
  const [stepImageFiles, setStepImageFiles] = useState<Record<number, File>>({});
  const [submitting, setSubmitting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProcedure, setDeletingProcedure] = useState<FirstAidProcedureListDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProcedures = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<FirstAidProcedureListDto[]>('/first-aid');
      setProcedures(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const getText = (text: LocalizedText | null) => {
    if (!text) return '';
    return text[lang] || text.uzLatin;
  };

  const openCreateDialog = () => {
    setEditingProcedure(null);
    setForm(emptyForm);
    setIconFile(null);
    setStepImageFiles({});
    setAutoSlug(true);
    setDialogOpen(true);
  };

  const openEditDialog = async (proc: FirstAidProcedureListDto) => {
    setLoadingDetail(true);
    setDialogOpen(true);
    try {
      const detail = await apiClient.get<FirstAidProcedureDto>(`/first-aid/${proc.slug}`);
      setEditingProcedure(detail);
      setForm(formFromProcedure(detail));
      setIconFile(null);
      setStepImageFiles({});
      setAutoSlug(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
      setDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDeleteDialog = (proc: FirstAidProcedureListDto) => {
    setDeletingProcedure(proc);
    setDeleteDialogOpen(true);
  };

  const updateField = <K extends keyof ProcedureFormData>(key: K, value: ProcedureFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'nameUzLatin' && autoSlug)
        next.slug = slugify(value as string);
      return next;
    });
  };

  const updateStep = (index: number, field: keyof StepFormData, value: string | number) => {
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, steps };
    });
  };

  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, emptyStep(prev.steps.length + 1)],
    }));
  };

  const removeStep = (index: number) => {
    setForm((prev) => {
      const steps = prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 }));
      return { ...prev, steps };
    });
  };

  const handleSubmit = async () => {
    if (!form.nameUzLatin.trim()) {
      toast.error(ts('admin.firstAid.nameRequired'));
      return;
    }
    if (!form.slug.trim()) {
      toast.error(ts('admin.firstAid.slugRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        slug: form.slug,
        name: { uz: form.nameUz, uzLatin: form.nameUzLatin, ru: form.nameRu },
        summary: (form.summaryUz || form.summaryUzLatin || form.summaryRu)
          ? { uz: form.summaryUz, uzLatin: form.summaryUzLatin, ru: form.summaryRu }
          : null,
        sortOrder: Number(form.sortOrder) || 0,
        // If an icon file is staged, the /icon endpoint will set IconUrl right after.
        iconUrl: iconFile ? '' : (form.iconUrl || ''),
        steps: form.steps.map((s, i) => ({
          ...(s.id ? { id: s.id } : {}),
          stepOrder: s.stepOrder,
          title: { uz: s.titleUz, uzLatin: s.titleUzLatin, ru: s.titleRu },
          description: { uz: s.descriptionUz, uzLatin: s.descriptionUzLatin, ru: s.descriptionRu },
          // Same idea per step — /steps/{id}/image overrides whatever URL is set.
          imageUrl: stepImageFiles[i] ? null : (s.imageUrl || null),
        })),
      };

      let procedureDto: FirstAidProcedureDto;
      if (editingProcedure) {
        await apiClient.put(`/admin/first-aid/${editingProcedure.id}`, payload);
        // Re-fetch to get updated step IDs (PUT may have created/deleted steps).
        procedureDto = await apiClient.get<FirstAidProcedureDto>(`/first-aid/${form.slug}`);
        toast.success(ts('admin.firstAid.updated'));
      } else {
        procedureDto = await apiClient.post<FirstAidProcedureDto>('/admin/first-aid', payload);
        toast.success(ts('admin.firstAid.created'));
      }

      // Procedure icon upload (optional)
      if (iconFile) {
        const fd = new FormData();
        fd.append('image', iconFile, iconFile.name);
        await apiClient.post(`/admin/first-aid/${procedureDto.id}/icon`, fd);
      }

      // Per-step image uploads (optional). Match local step indices to the
      // refreshed step IDs by stepOrder so reordering stays correct.
      for (const [idxStr, file] of Object.entries(stepImageFiles)) {
        const idx = Number(idxStr);
        const localStep = form.steps[idx];
        if (!localStep) continue;
        const remoteStep = procedureDto.steps.find((s) => s.stepOrder === localStep.stepOrder);
        if (!remoteStep) continue;
        const fd = new FormData();
        fd.append('image', file, file.name);
        await apiClient.post(
          `/admin/first-aid/${procedureDto.id}/steps/${remoteStep.id}/image`,
          fd,
        );
      }

      setDialogOpen(false);
      fetchProcedures();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProcedure) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/first-aid/${deletingProcedure.id}`);
      toast.success(ts('admin.firstAid.deleted'));
      setDeleteDialogOpen(false);
      setDeletingProcedure(null);
      fetchProcedures();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.navFirstAid')}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {ts('common.total')}: {procedures.length}
            </p>
          )}
        </div>
        <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.firstAid.addProcedure')}
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : !procedures.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <HeartPulse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">{ts('admin.firstAid.noProcedures')}</p>
            <p className="text-sm text-muted-foreground mb-4">{ts('admin.firstAid.createFirst')}</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              {ts('admin.firstAid.addProcedure')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {ts('admin.plans.nameSection')}
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-24">
                  {ts('admin.firstAid.stepsCount')}
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                  {ts('admin.categories.sortOrder')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                  {ts('admin.fines.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {procedures.map((proc) => (
                <tr key={proc.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{getText(proc.name)}</div>
                    {proc.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {getText(proc.summary)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                      {proc.stepCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-muted-foreground font-mono">#{proc.sortOrder}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(proc)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(proc)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProcedure ? ts('admin.firstAid.editTitle') : ts('admin.firstAid.createTitle')}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.nameSection')}</p>
                <Tabs defaultValue="uzLatin">
                  <TabsList className="w-full">
                    <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                    <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                    <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="uzLatin" className="mt-3">
                    <Input
                      value={form.nameUzLatin}
                      onChange={(e) => updateField('nameUzLatin', e.target.value)}
                      placeholder="Birinchi yordam nomi (lotin)"
                    />
                  </TabsContent>
                  <TabsContent value="uz" className="mt-3">
                    <Input
                      value={form.nameUz}
                      onChange={(e) => updateField('nameUz', e.target.value)}
                      placeholder="Биринчи ёрдам номи (кирилл)"
                    />
                  </TabsContent>
                  <TabsContent value="ru" className="mt-3">
                    <Input
                      value={form.nameRu}
                      onChange={(e) => updateField('nameRu', e.target.value)}
                      placeholder="Название процедуры"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.firstAid.summary')}</p>
                <Tabs defaultValue="uzLatin">
                  <TabsList className="w-full">
                    <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                    <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                    <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="uzLatin" className="mt-3">
                    <Textarea
                      value={form.summaryUzLatin}
                      onChange={(e) => updateField('summaryUzLatin', e.target.value)}
                      placeholder="Qisqa tavsif (lotin)"
                      rows={2}
                    />
                  </TabsContent>
                  <TabsContent value="uz" className="mt-3">
                    <Textarea
                      value={form.summaryUz}
                      onChange={(e) => updateField('summaryUz', e.target.value)}
                      placeholder="Қисқа тавсиф (кирилл)"
                      rows={2}
                    />
                  </TabsContent>
                  <TabsContent value="ru" className="mt-3">
                    <Textarea
                      value={form.summaryRu}
                      onChange={(e) => updateField('summaryRu', e.target.value)}
                      placeholder="Краткое описание"
                      rows={2}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <Label htmlFor="slug">{ts('admin.categories.slug')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      updateField('slug', e.target.value);
                    }}
                    placeholder="first-aid-slug"
                    className="flex-1"
                  />
                  {!autoSlug && !editingProcedure && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAutoSlug(true);
                        setForm((prev) => ({ ...prev, slug: slugify(prev.nameUzLatin) }));
                      }}
                    >
                      {ts('admin.categories.autoSlug')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sortOrder">{ts('admin.categories.sortOrder')}</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => updateField('sortOrder', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{ts('admin.firstAid.iconUrl')}</Label>
                  <div className="space-y-1">
                    <Label htmlFor="iconFile" className="text-xs font-normal text-muted-foreground">
                      {ts('admin.uploadFromDevice') ?? 'Upload from device'}
                    </Label>
                    <Input
                      id="iconFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
                    />
                    {iconFile && (
                      <p className="text-xs text-muted-foreground">
                        {iconFile.name} ({Math.round(iconFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="iconUrl" className="text-xs font-normal text-muted-foreground">
                      {ts('admin.orPasteUrl') ?? 'Or paste a URL / object key'}
                    </Label>
                    <Input
                      id="iconUrl"
                      value={form.iconUrl}
                      onChange={(e) => updateField('iconUrl', e.target.value)}
                      placeholder="https://..."
                      disabled={!!iconFile}
                    />
                    {iconFile && (
                      <p className="text-xs text-muted-foreground italic">
                        {ts('admin.urlIgnoredFileChosen') ?? 'File chosen — URL ignored'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Steps Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{ts('admin.firstAid.steps')}</p>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="h-3.5 w-3.5" />
                    {ts('admin.firstAid.addStep')}
                  </Button>
                </div>

                {form.steps.map((step, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-sm font-medium">
                          {ts('admin.firstAid.stepNumber')} {step.stepOrder}
                        </span>
                      </div>
                      {form.steps.length > 1 && (
                        <Button variant="ghost" size="icon-sm" onClick={() => removeStep(index)}>
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <Tabs defaultValue="uzLatin">
                      <TabsList className="w-full">
                        <TabsTrigger value="uzLatin" className="flex-1 text-xs data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                        <TabsTrigger value="uz" className="flex-1 text-xs data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                        <TabsTrigger value="ru" className="flex-1 text-xs data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="uzLatin" className="mt-2 space-y-2">
                        <Input
                          value={step.titleUzLatin}
                          onChange={(e) => updateStep(index, 'titleUzLatin', e.target.value)}
                          placeholder="Qadam sarlavhasi (lotin)"
                        />
                        <Textarea
                          value={step.descriptionUzLatin}
                          onChange={(e) => updateStep(index, 'descriptionUzLatin', e.target.value)}
                          placeholder="Qadam tavsifi (lotin)"
                          rows={2}
                        />
                      </TabsContent>
                      <TabsContent value="uz" className="mt-2 space-y-2">
                        <Input
                          value={step.titleUz}
                          onChange={(e) => updateStep(index, 'titleUz', e.target.value)}
                          placeholder="Қадам сарлавҳаси (кирилл)"
                        />
                        <Textarea
                          value={step.descriptionUz}
                          onChange={(e) => updateStep(index, 'descriptionUz', e.target.value)}
                          placeholder="Қадам тавсифи (кирилл)"
                          rows={2}
                        />
                      </TabsContent>
                      <TabsContent value="ru" className="mt-2 space-y-2">
                        <Input
                          value={step.titleRu}
                          onChange={(e) => updateStep(index, 'titleRu', e.target.value)}
                          placeholder="Заголовок шага"
                        />
                        <Textarea
                          value={step.descriptionRu}
                          onChange={(e) => updateStep(index, 'descriptionRu', e.target.value)}
                          placeholder="Описание шага"
                          rows={2}
                        />
                      </TabsContent>
                    </Tabs>

                    <div className="space-y-2">
                      <Label className="text-xs">{ts('admin.firstAid.stepImage')}</Label>
                      <div className="space-y-1">
                        <Input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setStepImageFiles((prev) => {
                              const next = { ...prev };
                              if (file) next[index] = file;
                              else delete next[index];
                              return next;
                            });
                          }}
                        />
                        {stepImageFiles[index] && (
                          <p className="text-xs text-muted-foreground">
                            {stepImageFiles[index].name} ({Math.round(stepImageFiles[index].size / 1024)} KB)
                          </p>
                        )}
                      </div>
                      <Input
                        value={step.imageUrl}
                        onChange={(e) => updateStep(index, 'imageUrl', e.target.value)}
                        placeholder={ts('admin.orPasteUrl') ?? 'Or paste a URL / object key'}
                        disabled={!!stepImageFiles[index]}
                      />
                      {stepImageFiles[index] && (
                        <p className="text-xs text-muted-foreground italic">
                          {ts('admin.urlIgnoredFileChosen') ?? 'File chosen — URL ignored'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || loadingDetail} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {submitting
                ? ts('admin.saving')
                : editingProcedure
                  ? ts('admin.saveBtn')
                  : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.firstAid.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.firstAid.deleteConfirm')}
            {deletingProcedure && (
              <span className="font-medium text-foreground"> {getText(deletingProcedure.name)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? ts('admin.firstAid.deleting') : ts('admin.firstAid.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
