'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { HazardLabelDto, LocalizedText } from '@/types/content';
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
import { Plus, Pencil, Trash2, TriangleAlert, ImageIcon } from 'lucide-react';
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

interface HazardLabelFormData {
  slug: string;
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  hazardClass: string;
  sortOrder: string;
  imageUrl: string;
}

const emptyForm: HazardLabelFormData = {
  slug: '',
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  hazardClass: '',
  sortOrder: '0',
  imageUrl: '',
};

function formFromLabel(label: HazardLabelDto): HazardLabelFormData {
  return {
    slug: label.slug,
    nameUz: label.name.uz,
    nameUzLatin: label.name.uzLatin,
    nameRu: label.name.ru,
    descriptionUz: label.description.uz,
    descriptionUzLatin: label.description.uzLatin,
    descriptionRu: label.description.ru,
    hazardClass: label.hazardClass,
    sortOrder: String(label.sortOrder),
    imageUrl: label.imageUrl ?? '',
  };
}

export default function HazardLabelsPage() {
  const { language } = useLocaleStore();
  const { t, ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const [labels, setLabels] = useState<HazardLabelDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<HazardLabelDto | null>(null);
  const [form, setForm] = useState<HazardLabelFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLabel, setDeletingLabel] = useState<HazardLabelDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<HazardLabelDto[]>('/hazard-labels');
      setLabels(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  const openCreateDialog = () => {
    setEditingLabel(null);
    setForm(emptyForm);
    setAutoSlug(true);
    setDialogOpen(true);
  };

  const openEditDialog = (label: HazardLabelDto) => {
    setEditingLabel(label);
    setForm(formFromLabel(label));
    setAutoSlug(false);
    setDialogOpen(true);
  };

  const openDeleteDialog = (label: HazardLabelDto) => {
    setDeletingLabel(label);
    setDeleteDialogOpen(true);
  };

  const updateField = <K extends keyof HazardLabelFormData>(key: K, value: HazardLabelFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'nameUzLatin' && autoSlug)
        next.slug = slugify(value as string);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.nameUzLatin.trim()) {
      toast.error(ts('admin.hazardLabels.nameRequired'));
      return;
    }
    if (!form.slug.trim()) {
      toast.error(ts('admin.hazardLabels.slugRequired'));
      return;
    }
    if (!form.hazardClass.trim()) {
      toast.error(ts('admin.hazardLabels.classRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        slug: form.slug,
        name: { uz: form.nameUz, uzLatin: form.nameUzLatin, ru: form.nameRu },
        description: { uz: form.descriptionUz, uzLatin: form.descriptionUzLatin, ru: form.descriptionRu },
        hazardClass: form.hazardClass,
        sortOrder: Number(form.sortOrder) || 0,
        imageUrl: form.imageUrl || null,
      };

      if (editingLabel) {
        await apiClient.put(`/admin/hazard-labels/${editingLabel.id}`, payload);
        toast.success(ts('admin.hazardLabels.updated'));
      } else {
        await apiClient.post('/admin/hazard-labels', payload);
        toast.success(ts('admin.hazardLabels.created'));
      }

      setDialogOpen(false);
      fetchLabels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLabel) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/hazard-labels/${deletingLabel.id}`);
      toast.success(ts('admin.hazardLabels.deleted'));
      setDeleteDialogOpen(false);
      setDeletingLabel(null);
      fetchLabels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{ts('admin.navHazardLabels')}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {ts('common.total')}: {labels.length}
            </p>
          )}
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.hazardLabels.addLabel')}
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : !labels.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <TriangleAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">{ts('admin.hazardLabels.noLabels')}</p>
            <p className="text-sm text-muted-foreground mb-4">{ts('admin.hazardLabels.createFirst')}</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              {ts('admin.hazardLabels.addLabel')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">
                  {ts('admin.hazardLabels.image')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {ts('admin.plans.nameSection')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">
                  {ts('admin.hazardLabels.hazardClass')}
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
              {labels.map((label) => (
                <tr key={label.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    {label.imageUrl ? (
                      <img
                        src={label.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{getText(label.name)}</div>
                    {label.description[lang] && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {getText(label.description)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
                      {label.hazardClass}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-muted-foreground font-mono">#{label.sortOrder}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(label)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(label)}>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLabel ? ts('admin.hazardLabels.editTitle') : ts('admin.hazardLabels.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.nameSection')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Input
                    value={form.nameUzLatin}
                    onChange={(e) => updateField('nameUzLatin', e.target.value)}
                    placeholder="Xavf belgisi nomi (lotin)"
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Input
                    value={form.nameUz}
                    onChange={(e) => updateField('nameUz', e.target.value)}
                    placeholder="Хавф белгиси номи (кирилл)"
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Input
                    value={form.nameRu}
                    onChange={(e) => updateField('nameRu', e.target.value)}
                    placeholder="Название знака"
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.descSection')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Textarea
                    value={form.descriptionUzLatin}
                    onChange={(e) => updateField('descriptionUzLatin', e.target.value)}
                    placeholder="Tavsif (lotin)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Textarea
                    value={form.descriptionUz}
                    onChange={(e) => updateField('descriptionUz', e.target.value)}
                    placeholder="Тавсиф (кирилл)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Textarea
                    value={form.descriptionRu}
                    onChange={(e) => updateField('descriptionRu', e.target.value)}
                    placeholder="Описание"
                    rows={3}
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
                  placeholder="hazard-label-slug"
                  className="flex-1"
                />
                {!autoSlug && !editingLabel && (
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
                <Label htmlFor="hazardClass">{ts('admin.hazardLabels.hazardClass')}</Label>
                <Input
                  id="hazardClass"
                  value={form.hazardClass}
                  onChange={(e) => updateField('hazardClass', e.target.value)}
                  placeholder="1.1, 2.3, etc."
                />
              </div>
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
            </div>

            <div>
              <Label htmlFor="imageUrl">{ts('admin.hazardLabels.imageUrl')}</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? ts('admin.saving')
                : editingLabel
                  ? ts('admin.saveBtn')
                  : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ts('admin.hazardLabels.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.hazardLabels.deleteConfirm')}
            {deletingLabel && (
              <span className="font-medium text-foreground"> {getText(deletingLabel.name)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? ts('admin.hazardLabels.deleting') : ts('admin.hazardLabels.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
