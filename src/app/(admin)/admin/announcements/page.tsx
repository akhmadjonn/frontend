'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { type Column, type DataTableProps } from '@/components/admin/data-table';
import { apiClient } from '@/lib/api-client';
import type { AnnouncementDto, PaginatedList, LocalizedText } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded h-96" />,
}) as ComponentType<DataTableProps<AnnouncementDto>>;
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';
import { format } from 'date-fns';

type AnnouncementType = 'Info' | 'Warning' | 'Important';

function normalizeType(type: string | null | undefined): AnnouncementType {
  const t = String(type ?? '').toLowerCase();
  if (t === 'warning') return 'Warning';
  if (t === 'important') return 'Important';
  return 'Info';
}

function getTypeConfig(ts: (key: string) => string): Record<AnnouncementType, { label: string; icon: React.ReactNode; badgeClassName: string; bannerClassName: string }> {
  return {
    Info: {
      label: ts('admin.announcements.typeInfo'),
      icon: <Info className="h-4 w-4" />,
      badgeClassName: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      bannerClassName: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
    },
    Warning: {
      label: ts('admin.announcements.typeWarning'),
      icon: <AlertTriangle className="h-4 w-4" />,
      badgeClassName: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      bannerClassName: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-300',
    },
    Important: {
      label: ts('admin.announcements.typeImportant'),
      icon: <AlertCircle className="h-4 w-4" />,
      badgeClassName: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      bannerClassName: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
    },
  };
}

interface AnnouncementFormState {
  titleUz: string;
  titleUzLatin: string;
  titleRu: string;
  contentUz: string;
  contentUzLatin: string;
  contentRu: string;
  type: AnnouncementType;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
}

const emptyForm: AnnouncementFormState = {
  titleUz: '',
  titleUzLatin: '',
  titleRu: '',
  contentUz: '',
  contentUzLatin: '',
  contentRu: '',
  type: 'Info',
  isActive: true,
  startsAt: '',
  expiresAt: '',
};

const PAGE_SIZE = 20;

export default function AnnouncementsPage() {
  const { language } = useLocaleStore();
  const { ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const TYPE_CONFIG = getTypeConfig(ts);

  const [data, setData] = useState<PaginatedList<AnnouncementDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const result = await apiClient.get<PaginatedList<AnnouncementDto>>(
        `/admin/announcements?${params.toString()}`
      );
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.announcements.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (announcement: AnnouncementDto) => {
    setEditingId(announcement.id);
    setForm({
      titleUz: announcement.title.uz,
      titleUzLatin: announcement.title.uzLatin,
      titleRu: announcement.title.ru,
      contentUz: announcement.content.uz,
      contentUzLatin: announcement.content.uzLatin,
      contentRu: announcement.content.ru,
      type: normalizeType(announcement.type),
      isActive: announcement.isActive,
      startsAt: announcement.startsAt ? announcement.startsAt.slice(0, 16) : '',
      expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titleUzLatin.trim()) {
      toast.error(ts('admin.announcements.titleRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: { uz: form.titleUz, uzLatin: form.titleUzLatin, ru: form.titleRu },
        content: { uz: form.contentUz, uzLatin: form.contentUzLatin, ru: form.contentRu },
        type: form.type,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };

      if (editingId) {
        await apiClient.put(`/admin/announcements/${editingId}`, payload);
        toast.success(ts('admin.announcements.updated'));
      } else {
        await apiClient.post('/admin/announcements', payload);
        toast.success(ts('admin.announcements.created'));
      }

      setDialogOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.announcements.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/admin/announcements/${deletingId}`);
      toast.success(ts('admin.announcements.deleted'));
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.announcements.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const renderTypeBadge = (type: AnnouncementType | string) => {
    const config = TYPE_CONFIG[normalizeType(type)];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClassName}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const previewTitle = form.titleUzLatin || form.titleUz || form.titleRu || ts('admin.announcements.previewTitle');
  const previewContent = form.contentUzLatin || form.contentUz || form.contentRu || ts('admin.announcements.previewContent');
  const previewConfig = TYPE_CONFIG[normalizeType(form.type)];

  const columns: Column<AnnouncementDto>[] = [
    {
      key: 'title',
      header: ts('admin.announcements.heading'),
      className: 'min-w-[200px]',
      render: (a) => (
        <span className="font-medium text-sm">{getText(a.title)}</span>
      ),
    },
    {
      key: 'type',
      header: ts('admin.announcements.type'),
      className: 'w-28',
      render: (a) => renderTypeBadge(a.type),
    },
    {
      key: 'isActive',
      header: ts('admin.announcements.statusLabel'),
      className: 'w-20',
      render: (a) =>
        a.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {ts('admin.active')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            {ts('admin.inactive')}
          </span>
        ),
    },
    {
      key: 'startsAt',
      header: ts('admin.announcements.startDate'),
      className: 'min-w-[120px]',
      render: (a) =>
        a.startsAt ? (
          <span className="text-sm">{format(new Date(a.startsAt), 'dd.MM.yyyy HH:mm')}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: 'expiresAt',
      header: ts('admin.announcements.endDate'),
      className: 'min-w-[120px]',
      render: (a) =>
        a.expiresAt ? (
          <span className="text-sm">{format(new Date(a.expiresAt), 'dd.MM.yyyy HH:mm')}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: 'createdAt',
      header: ts('admin.announcements.createdAt'),
      className: 'min-w-[100px]',
      render: (a) => (
        <span className="text-sm">{format(new Date(a.createdAt), 'dd.MM.yyyy')}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (a) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(a)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(a.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.announcements.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {ts('admin.announcements.subtitle')}
          </p>
        </div>
        <Button size="sm" className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {ts('admin.announcements.addBtn')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={loading}
        rowKey={(a) => a.id}
        page={page}
        totalPages={data?.meta.totalPages}
        onPageChange={setPage}
        emptyMessage={ts('admin.announcements.notFound')}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? ts('admin.announcements.editTitle') : ts('admin.announcements.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{ts('admin.announcements.heading')}</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">{ts('admin.langUzLatin')}</Label>
                  <Input
                    value={form.titleUzLatin}
                    onChange={(e) => setForm((prev) => ({ ...prev, titleUzLatin: e.target.value }))}
                    placeholder={ts('admin.announcements.headingPlaceholderLatin')}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{ts('admin.langUzCyrillic')}</Label>
                  <Input
                    value={form.titleUz}
                    onChange={(e) => setForm((prev) => ({ ...prev, titleUz: e.target.value }))}
                    placeholder="Эълон сарлавҳаси (кирилл)"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{ts('admin.langRussian')}</Label>
                  <Input
                    value={form.titleRu}
                    onChange={(e) => setForm((prev) => ({ ...prev, titleRu: e.target.value }))}
                    placeholder="Заголовок объявления"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">{ts('admin.announcements.contentLabel')}</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">{ts('admin.langUzLatin')}</Label>
                  <Textarea
                    value={form.contentUzLatin}
                    onChange={(e) => setForm((prev) => ({ ...prev, contentUzLatin: e.target.value }))}
                    placeholder={ts('admin.announcements.contentPlaceholderLatin')}
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{ts('admin.langUzCyrillic')}</Label>
                  <Textarea
                    value={form.contentUz}
                    onChange={(e) => setForm((prev) => ({ ...prev, contentUz: e.target.value }))}
                    placeholder="Эълон матни (кирилл)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{ts('admin.langRussian')}</Label>
                  <Textarea
                    value={form.contentRu}
                    onChange={(e) => setForm((prev) => ({ ...prev, contentRu: e.target.value }))}
                    placeholder="Текст объявления"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{ts('admin.announcements.type')}</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, type: val as AnnouncementType }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Info">{ts('admin.announcements.typeInfo')}</SelectItem>
                    <SelectItem value="Warning">{ts('admin.announcements.typeWarning')}</SelectItem>
                    <SelectItem value="Important">{ts('admin.announcements.typeImportant')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{ts('admin.announcements.statusLabel')}</Label>
                <div className="flex items-center gap-2 h-8">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <span className="text-sm">{form.isActive ? ts('admin.active') : ts('admin.inactive')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ann-starts">{ts('admin.announcements.startDateLabel')}</Label>
                <Input
                  id="ann-starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-expires">{ts('admin.announcements.endDateLabel')}</Label>
                <Input
                  id="ann-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{ts('admin.announcements.preview')}</Label>
              <div className={`flex items-start gap-3 rounded-lg border p-3 ${previewConfig.bannerClassName}`}>
                <div className="mt-0.5">{previewConfig.icon}</div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{previewTitle}</p>
                  <p className="text-xs opacity-80">{previewContent}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {saving ? ts('admin.saving') : editingId ? ts('admin.updateBtn') : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.announcements.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.announcements.deleteConfirm')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? ts('admin.announcements.deleting') : ts('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
