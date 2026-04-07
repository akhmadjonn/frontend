'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { FineDto, PaginatedList, LocalizedText } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Gavel, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';

const formatMoney = (tiyins: number) =>
  `${(tiyins / 100).toLocaleString('uz-UZ')} so'm`;

interface FineFormData {
  articleNumber: string;
  violationUz: string;
  violationUzLatin: string;
  violationRu: string;
  notesUz: string;
  notesUzLatin: string;
  notesRu: string;
  penaltyMin: string;
  penaltyMax: string;
  isActive: boolean;
}

const emptyForm: FineFormData = {
  articleNumber: '',
  violationUz: '',
  violationUzLatin: '',
  violationRu: '',
  notesUz: '',
  notesUzLatin: '',
  notesRu: '',
  penaltyMin: '',
  penaltyMax: '',
  isActive: true,
};

function formFromFine(fine: FineDto): FineFormData {
  return {
    articleNumber: fine.articleNumber,
    violationUz: fine.violationDescription.uz,
    violationUzLatin: fine.violationDescription.uzLatin,
    violationRu: fine.violationDescription.ru,
    notesUz: fine.additionalNotes?.uz ?? '',
    notesUzLatin: fine.additionalNotes?.uzLatin ?? '',
    notesRu: fine.additionalNotes?.ru ?? '',
    penaltyMin: String(fine.penaltyAmountTiyins / 100),
    penaltyMax: fine.penaltyMaxTiyins ? String(fine.penaltyMaxTiyins / 100) : '',
    isActive: fine.isActive,
  };
}

const PAGE_SIZE = 20;

export default function FinesPage() {
  const { language } = useLocaleStore();
  const { t, ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const [fines, setFines] = useState<FineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFine, setEditingFine] = useState<FineDto | null>(null);
  const [form, setForm] = useState<FineFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFine, setDeletingFine] = useState<FineDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<PaginatedList<FineDto>>(
        `/fines?page=${page}&pageSize=${PAGE_SIZE}`
      );
      setFines(data.items);
      setTotalPages(data.meta.totalPages);
      setTotalCount(data.meta.totalCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  const openCreateDialog = () => {
    setEditingFine(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (fine: FineDto) => {
    setEditingFine(fine);
    setForm(formFromFine(fine));
    setDialogOpen(true);
  };

  const openDeleteDialog = (fine: FineDto) => {
    setDeletingFine(fine);
    setDeleteDialogOpen(true);
  };

  const updateField = <K extends keyof FineFormData>(key: K, value: FineFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.articleNumber.trim()) {
      toast.error(ts('admin.fines.articleRequired'));
      return;
    }
    if (!form.violationUzLatin.trim()) {
      toast.error(ts('admin.fines.violationRequired'));
      return;
    }
    const penaltyMin = Number(form.penaltyMin);
    if (!penaltyMin || penaltyMin <= 0) {
      toast.error(ts('admin.fines.penaltyRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        articleNumber: form.articleNumber,
        violationDescription: {
          uz: form.violationUz,
          uzLatin: form.violationUzLatin,
          ru: form.violationRu,
        },
        additionalNotes: (form.notesUz || form.notesUzLatin || form.notesRu)
          ? { uz: form.notesUz, uzLatin: form.notesUzLatin, ru: form.notesRu }
          : null,
        penaltyAmountTiyins: Math.round(penaltyMin * 100),
        penaltyMaxTiyins: form.penaltyMax ? Math.round(Number(form.penaltyMax) * 100) : null,
        isActive: form.isActive,
      };

      if (editingFine) {
        await apiClient.put(`/admin/fines/${editingFine.id}`, payload);
        toast.success(ts('admin.fines.updated'));
      } else {
        await apiClient.post('/admin/fines', payload);
        toast.success(ts('admin.fines.created'));
      }

      setDialogOpen(false);
      fetchFines();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFine) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/fines/${deletingFine.id}`);
      toast.success(ts('admin.fines.deleted'));
      setDeleteDialogOpen(false);
      setDeletingFine(null);
      fetchFines();
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
          <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.navFines')}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {ts('common.total')}: {totalCount}
            </p>
          )}
        </div>
        <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.fines.addFine')}
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
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : !fines.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">{ts('admin.fines.noFines')}</p>
            <p className="text-sm text-muted-foreground mb-4">{ts('admin.fines.createFirst')}</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              {ts('admin.fines.addFine')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">
                    {ts('admin.fines.article')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {ts('admin.fines.violation')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-40">
                    {ts('admin.fines.penalty')}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                    {ts('admin.questions.status')}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                    {ts('admin.fines.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {fines.map((fine) => (
                  <tr key={fine.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-sm">{fine.articleNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-2">{getText(fine.violationDescription)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">
                        {formatMoney(fine.penaltyAmountTiyins)}
                        {fine.penaltyMaxTiyins && (
                          <span className="text-muted-foreground"> — {formatMoney(fine.penaltyMaxTiyins)}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={fine.isActive ? 'default' : 'secondary'}>
                        {fine.isActive ? ts('admin.active') : ts('admin.inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(fine)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(fine)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFine ? ts('admin.fines.editTitle') : ts('admin.fines.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="articleNumber">{ts('admin.fines.article')}</Label>
              <Input
                id="articleNumber"
                value={form.articleNumber}
                onChange={(e) => updateField('articleNumber', e.target.value)}
                placeholder="128-1"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.fines.violation')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Textarea
                    value={form.violationUzLatin}
                    onChange={(e) => updateField('violationUzLatin', e.target.value)}
                    placeholder="Qoidabuzarlik tavsifi (lotin)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Textarea
                    value={form.violationUz}
                    onChange={(e) => updateField('violationUz', e.target.value)}
                    placeholder="Қоидабузарлик тавсифи (кирилл)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Textarea
                    value={form.violationRu}
                    onChange={(e) => updateField('violationRu', e.target.value)}
                    placeholder="Описание нарушения"
                    rows={3}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.fines.additionalNotes')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Textarea
                    value={form.notesUzLatin}
                    onChange={(e) => updateField('notesUzLatin', e.target.value)}
                    placeholder="Qo'shimcha eslatmalar (lotin)"
                    rows={2}
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Textarea
                    value={form.notesUz}
                    onChange={(e) => updateField('notesUz', e.target.value)}
                    placeholder="Қўшимча эслатмалар (кирилл)"
                    rows={2}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Textarea
                    value={form.notesRu}
                    onChange={(e) => updateField('notesRu', e.target.value)}
                    placeholder="Дополнительные примечания"
                    rows={2}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="penaltyMin">{ts('admin.fines.penaltyMin')}</Label>
                <Input
                  id="penaltyMin"
                  type="number"
                  min="0"
                  value={form.penaltyMin}
                  onChange={(e) => updateField('penaltyMin', e.target.value)}
                  placeholder="50 000"
                />
                <p className="text-xs text-muted-foreground mt-1">{ts('admin.fines.amountInSom')}</p>
              </div>
              <div>
                <Label htmlFor="penaltyMax">{ts('admin.fines.penaltyMax')}</Label>
                <Input
                  id="penaltyMax"
                  type="number"
                  min="0"
                  value={form.penaltyMax}
                  onChange={(e) => updateField('penaltyMax', e.target.value)}
                  placeholder="100 000"
                />
                <p className="text-xs text-muted-foreground mt-1">{ts('admin.fines.optional')}</p>
              </div>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {submitting
                ? ts('admin.saving')
                : editingFine
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
            <DialogTitle>{ts('admin.fines.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.fines.deleteConfirm')}
            {deletingFine && (
              <span className="font-medium text-foreground"> {deletingFine.articleNumber}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? ts('admin.fines.deleting') : ts('admin.fines.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
