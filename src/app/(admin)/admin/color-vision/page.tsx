'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AdminColorVisionPlateDto } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, ImageIcon, Upload, X } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface PlateFormData {
  plateNumber: string;
  expectedAnswer: string;
  alternateAnswer: string;
  isActive: boolean;
}

const emptyForm: PlateFormData = {
  plateNumber: '0',
  expectedAnswer: '',
  alternateAnswer: '',
  isActive: true,
};

function formFromPlate(plate: AdminColorVisionPlateDto): PlateFormData {
  return {
    plateNumber: String(plate.plateNumber),
    expectedAnswer: plate.expectedAnswer,
    alternateAnswer: plate.alternateAnswer ?? '',
    isActive: plate.isActive,
  };
}

export default function AdminColorVisionPage() {
  const { ts } = useLocale();

  const [plates, setPlates] = useState<AdminColorVisionPlateDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlate, setEditingPlate] = useState<AdminColorVisionPlateDto | null>(null);
  const [form, setForm] = useState<PlateFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPlate, setDeletingPlate] = useState<AdminColorVisionPlateDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const dialogFileRef = useRef<HTMLInputElement>(null);

  const fetchPlates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<AdminColorVisionPlateDto[]>('/admin/color-vision/plates');
      setPlates(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlates();
  }, [fetchPlates]);

  const openCreateDialog = () => {
    setEditingPlate(null);
    const nextNum = plates.length ? Math.max(...plates.map((p) => p.plateNumber)) + 1 : 1;
    setForm({ ...emptyForm, plateNumber: String(nextNum) });
    setSelectedImage(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (plate: AdminColorVisionPlateDto) => {
    setEditingPlate(plate);
    setForm(formFromPlate(plate));
    setSelectedImage(null);
    setImagePreview(plate.imageUrl);
    setDialogOpen(true);
  };

  const openDeleteDialog = (plate: AdminColorVisionPlateDto) => {
    setDeletingPlate(plate);
    setDeleteDialogOpen(true);
  };

  const updateField = <K extends keyof PlateFormData>(key: K, value: PlateFormData[K]) => {
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
    if (editingPlate)
      setImagePreview(editingPlate.imageUrl);
    else
      setImagePreview(null);
  };

  const uploadImage = async (plateId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/color-vision/plates/${plateId}/image`,
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
    if (!form.expectedAnswer.trim()) {
      toast.error(ts('admin.colorVision.answerRequired'));
      return;
    }
    if (Number(form.plateNumber) <= 0) {
      toast.error(ts('admin.colorVision.plateNumberRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const nextSort = plates.length ? Math.max(...plates.map((p) => p.sortOrder)) + 1 : 1;

      const payload = {
        plateNumber: Number(form.plateNumber),
        expectedAnswer: form.expectedAnswer.trim(),
        alternateAnswer: form.alternateAnswer.trim() || null,
        sortOrder: editingPlate ? editingPlate.sortOrder : nextSort,
        isActive: form.isActive,
      };

      let plateId: string;

      if (editingPlate) {
        await apiClient.put(`/admin/color-vision/plates/${editingPlate.id}`, {
          id: editingPlate.id,
          ...payload,
        });
        plateId = editingPlate.id;
        toast.success(ts('admin.colorVision.updated'));
      } else {
        const id = await apiClient.post<string>('/admin/color-vision/plates', payload);
        plateId = id;
        toast.success(ts('admin.colorVision.created'));
      }

      if (selectedImage)
        await uploadImage(plateId, selectedImage);

      setDialogOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchPlates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlate) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/color-vision/plates/${deletingPlate.id}`);
      toast.success(ts('admin.colorVision.deleted'));
      setDeleteDialogOpen(false);
      setDeletingPlate(null);
      fetchPlates();
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
          <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.colorVision.title')}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {ts('common.total')}: {plates.length}
            </p>
          )}
        </div>
        <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.colorVision.addPlate')}
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : !plates.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">{ts('admin.colorVision.noPlates')}</p>
            <p className="text-sm text-muted-foreground mb-4">{ts('admin.colorVision.createFirst')}</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              {ts('admin.colorVision.addPlate')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">
                  {ts('admin.colorVision.image')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {ts('admin.colorVision.expectedAnswer')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">
                  {ts('admin.colorVision.alternateAnswer')}
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
              {plates.map((plate) => (
                <tr key={plate.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3 text-center font-mono font-medium">
                    {plate.plateNumber}
                  </td>
                  <td className="px-4 py-3">
                    {plate.imageUrl ? (
                      <img
                        src={plate.imageUrl}
                        alt={`Plate ${plate.plateNumber}`}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                      {plate.expectedAnswer}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {plate.alternateAnswer ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={plate.isActive ? 'default' : 'secondary'}>
                      {plate.isActive ? ts('admin.active') : ts('admin.inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(plate)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(plate)}>
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlate ? ts('admin.colorVision.editTitle') : ts('admin.colorVision.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image upload */}
            <div>
              <Label>{ts('admin.colorVision.image')}</Label>
              <input
                ref={dialogFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onDialogFileSelected}
              />
              {imagePreview ? (
                <div className="relative mt-2 w-fit">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-32 rounded-lg object-cover border"
                  />
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => dialogFileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {ts('admin.colorVision.changeImage')}
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => dialogFileRef.current?.click()}
                  className="mt-2 flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{ts('admin.colorVision.uploadImage')}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="plateNumber">{ts('admin.colorVision.plateNumber')}</Label>
              <Input
                id="plateNumber"
                type="number"
                min="1"
                value={form.plateNumber}
                onChange={(e) => updateField('plateNumber', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="expectedAnswer">{ts('admin.colorVision.expectedAnswer')}</Label>
              <Input
                id="expectedAnswer"
                value={form.expectedAnswer}
                onChange={(e) => updateField('expectedAnswer', e.target.value)}
                placeholder="12"
              />
            </div>

            <div>
              <Label htmlFor="alternateAnswer">
                {ts('admin.colorVision.alternateAnswer')}
                <span className="text-muted-foreground ml-1">({ts('admin.fines.optional')})</span>
              </Label>
              <Input
                id="alternateAnswer"
                value={form.alternateAnswer}
                onChange={(e) => updateField('alternateAnswer', e.target.value)}
                placeholder=""
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => updateField('isActive', checked)}
              />
              <Label htmlFor="isActive">
                {form.isActive ? ts('admin.active') : ts('admin.inactive')}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {submitting
                ? ts('admin.saving')
                : editingPlate
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
            <DialogTitle>{ts('admin.colorVision.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.colorVision.deleteConfirm')}
            {deletingPlate && (
              <span className="font-medium text-foreground"> #{deletingPlate.plateNumber}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? ts('admin.colorVision.deleting') : ts('admin.colorVision.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
