'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { RoadMarkingDto, RoadMarkingType, LocalizedText } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Ruler, ImageIcon, Upload, X } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';

interface MarkingFormData {
  markingCode: string;
  markingType: string;
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: MarkingFormData = {
  markingCode: '',
  markingType: '1',
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  sortOrder: '0',
  isActive: true,
};

function formFromMarking(marking: RoadMarkingDto): MarkingFormData {
  return {
    markingCode: marking.markingCode,
    markingType: String(marking.markingType),
    nameUz: marking.name.uz,
    nameUzLatin: marking.name.uzLatin,
    nameRu: marking.name.ru,
    descriptionUz: marking.description?.uz ?? '',
    descriptionUzLatin: marking.description?.uzLatin ?? '',
    descriptionRu: marking.description?.ru ?? '',
    sortOrder: String(marking.sortOrder),
    isActive: marking.isActive,
  };
}

export default function RoadMarkingsPage() {
  const { language } = useLocaleStore();
  const { ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const [markings, setMarkings] = useState<RoadMarkingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarking, setEditingMarking] = useState<RoadMarkingDto | null>(null);
  const [form, setForm] = useState<MarkingFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMarking, setDeletingMarking] = useState<RoadMarkingDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const dialogFileRef = useRef<HTMLInputElement>(null);

  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  const fetchMarkings = useCallback(async () => {
    setLoading(true);
    try {
      const query = filterType && filterType !== 'all' ? `?type=${filterType}` : '';
      const data = await apiClient.get<RoadMarkingDto[]>(`/admin/road-markings${query}`);
      setMarkings(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchMarkings();
  }, [fetchMarkings]);

  const openCreateDialog = () => {
    setEditingMarking(null);
    setForm({ ...emptyForm, markingType: filterType !== 'all' ? filterType : '1' });
    setSelectedImage(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (marking: RoadMarkingDto) => {
    setEditingMarking(marking);
    setForm(formFromMarking(marking));
    setSelectedImage(null);
    setImagePreview(marking.thumbnailUrl || marking.imageUrl);
    setDialogOpen(true);
  };

  const openDeleteDialog = (marking: RoadMarkingDto) => {
    setDeletingMarking(marking);
    setDeleteDialogOpen(true);
  };

  const updateField = <K extends keyof MarkingFormData>(key: K, value: MarkingFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onDialogFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (editingMarking)
      setImagePreview(editingMarking.thumbnailUrl || editingMarking.imageUrl);
    else
      setImagePreview(null);
  };

  const uploadImage = async (markingId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/road-markings/${markingId}/image`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Upload failed');
  };

  const handleSubmit = async () => {
    if (!form.nameUzLatin.trim()) {
      toast.error(ts('admin.roadMarkings.nameRequired'));
      return;
    }
    if (!form.markingCode.trim()) {
      toast.error(ts('admin.roadMarkings.codeRequired'));
      return;
    }
    if (!form.markingType) {
      toast.error(ts('admin.roadMarkings.typeRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        markingCode: form.markingCode,
        markingType: Number(form.markingType) as RoadMarkingType,
        name: { uz: form.nameUz, uzLatin: form.nameUzLatin, ru: form.nameRu },
        description: form.descriptionUzLatin.trim()
          ? { uz: form.descriptionUz, uzLatin: form.descriptionUzLatin, ru: form.descriptionRu }
          : null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      let markingId: string;

      if (editingMarking) {
        await apiClient.put(`/admin/road-markings/${editingMarking.id}`, payload);
        markingId = editingMarking.id;
        toast.success(ts('admin.roadMarkings.updated'));
      } else {
        const id = await apiClient.post<string>('/admin/road-markings', payload);
        markingId = id;
        toast.success(ts('admin.roadMarkings.created'));
      }

      if (selectedImage)
        await uploadImage(markingId, selectedImage);

      setDialogOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchMarkings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMarking) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/road-markings/${deletingMarking.id}`);
      toast.success(ts('admin.roadMarkings.deleted'));
      setDeleteDialogOpen(false);
      setDeletingMarking(null);
      fetchMarkings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const getTypeBadge = (type: RoadMarkingType) => {
    if (type === 1)
      return <Badge variant="default" className="text-xs">{ts('admin.roadMarkings.horizontal')}</Badge>;
    return <Badge variant="secondary" className="text-xs">{ts('admin.roadMarkings.vertical')}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.navRoadMarkings')}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {ts('common.total')}: {markings.length}
            </p>
          )}
        </div>
        <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.roadMarkings.addMarking')}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? 'all')}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={ts('admin.roadMarkings.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ts('admin.roadMarkings.allTypes')}</SelectItem>
            <SelectItem value="1">{ts('admin.roadMarkings.horizontal')}</SelectItem>
            <SelectItem value="2">{ts('admin.roadMarkings.vertical')}</SelectItem>
          </SelectContent>
        </Select>
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : !markings.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">{ts('admin.roadMarkings.noMarkings')}</p>
            <p className="text-sm text-muted-foreground mb-4">{ts('admin.roadMarkings.createFirst')}</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              {ts('admin.roadMarkings.addMarking')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">
                  {ts('admin.roadMarkings.image')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">
                  {ts('admin.roadMarkings.markingCode')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {ts('admin.plans.nameSection')}
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-28">
                  {ts('admin.roadMarkings.markingType')}
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                  {ts('admin.colorVision.status')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                  {ts('admin.fines.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {markings.map((marking) => (
                <tr key={marking.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3">
                    {marking.thumbnailUrl || marking.imageUrl ? (
                      <img
                        src={marking.thumbnailUrl || marking.imageUrl!}
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
                    <span className="font-mono text-xs">{marking.markingCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{getText(marking.name)}</div>
                    {marking.description?.[lang] && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {getText(marking.description)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getTypeBadge(marking.markingType)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={marking.isActive ? 'default' : 'secondary'} className="text-xs">
                      {marking.isActive ? ts('admin.roadMarkings.active') : ts('admin.roadMarkings.inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(marking)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(marking)}>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMarking ? ts('admin.roadMarkings.editTitle') : ts('admin.roadMarkings.createTitle')}
            </DialogTitle>
          </DialogHeader>

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
                    placeholder="Chiziq nomi (lotin)"
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Input
                    value={form.nameUz}
                    onChange={(e) => updateField('nameUz', e.target.value)}
                    placeholder="Чизиқ номи (кирилл)"
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Input
                    value={form.nameRu}
                    onChange={(e) => updateField('nameRu', e.target.value)}
                    placeholder="Название разметки"
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.descSection')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="markingCode">{ts('admin.roadMarkings.markingCode')}</Label>
                <Input
                  id="markingCode"
                  value={form.markingCode}
                  onChange={(e) => updateField('markingCode', e.target.value)}
                  placeholder="1.1, 1.2.1, etc."
                />
              </div>
              <div>
                <Label htmlFor="markingType">{ts('admin.roadMarkings.markingType')}</Label>
                <Select value={form.markingType} onValueChange={(v) => updateField('markingType', v ?? '1')}>
                  <SelectTrigger id="markingType">
                    <SelectValue placeholder={ts('admin.roadMarkings.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{ts('admin.roadMarkings.horizontal')}</SelectItem>
                    <SelectItem value="2">{ts('admin.roadMarkings.vertical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="markingSortOrder">{ts('admin.categories.sortOrder')}</Label>
                <Input
                  id="markingSortOrder"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => updateField('sortOrder', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label>{ts('admin.roadMarkings.image')}</Label>
              <input
                ref={dialogFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onDialogFileSelected}
              />
              {imagePreview ? (
                <div className="relative mt-2 inline-block">
                  <img src={imagePreview} alt="" className="h-32 w-32 rounded-lg object-cover border" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive text-white p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => dialogFileRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {ts('admin.roadMarkings.uploadImage')}
                </Button>
              )}
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 ml-2"
                  onClick={() => dialogFileRef.current?.click()}
                >
                  {ts('admin.roadMarkings.changeImage')}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {submitting
                ? ts('admin.saving')
                : editingMarking
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
            <DialogTitle>{ts('admin.roadMarkings.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.roadMarkings.deleteConfirm')}
            {deletingMarking && (
              <span className="font-medium text-foreground"> {getText(deletingMarking.name)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? ts('admin.roadMarkings.deleting') : ts('admin.roadMarkings.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
