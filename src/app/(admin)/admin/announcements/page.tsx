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
import { format } from 'date-fns';

type AnnouncementType = 'Info' | 'Warning' | 'Important';

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: React.ReactNode; badgeClassName: string; bannerClassName: string }> = {
  Info: {
    label: "Ma'lumot",
    icon: <Info className="h-4 w-4" />,
    badgeClassName: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    bannerClassName: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
  },
  Warning: {
    label: 'Ogohlantirish',
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClassName: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    bannerClassName: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-300',
  },
  Important: {
    label: 'Muhim',
    icon: <AlertCircle className="h-4 w-4" />,
    badgeClassName: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    bannerClassName: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
  },
};

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
  const lang = language as keyof LocalizedText;

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
      toast.error(err instanceof Error ? err.message : "E'lonlarni yuklashda xatolik");
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
      type: announcement.type,
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
      toast.error("E'lon sarlavhasini kiriting (UZ Lotin)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: {
          uz: form.titleUz,
          uzLatin: form.titleUzLatin,
          ru: form.titleRu,
        },
        content: {
          uz: form.contentUz,
          uzLatin: form.contentUzLatin,
          ru: form.contentRu,
        },
        type: form.type,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };

      if (editingId) {
        await apiClient.put(`/admin/announcements/${editingId}`, payload);
        toast.success("E'lon yangilandi");
      } else {
        await apiClient.post('/admin/announcements', payload);
        toast.success("E'lon yaratildi");
      }

      setDialogOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/admin/announcements/${deletingId}`);
      toast.success("E'lon o'chirildi");
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  const renderTypeBadge = (type: AnnouncementType) => {
    const config = TYPE_CONFIG[type];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClassName}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const previewTitle = form.titleUzLatin || form.titleUz || form.titleRu || "E'lon sarlavhasi";
  const previewContent = form.contentUzLatin || form.contentUz || form.contentRu || "E'lon matni shu yerda ko'rsatiladi.";
  const previewConfig = TYPE_CONFIG[form.type];

  const columns: Column<AnnouncementDto>[] = [
    {
      key: 'title',
      header: 'Sarlavha',
      className: 'min-w-[200px]',
      render: (a) => (
        <span className="font-medium text-sm">{getText(a.title)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Turi',
      className: 'w-28',
      render: (a) => renderTypeBadge(a.type),
    },
    {
      key: 'isActive',
      header: 'Holat',
      className: 'w-20',
      render: (a) =>
        a.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Faol
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            Nofaol
          </span>
        ),
    },
    {
      key: 'startsAt',
      header: 'Boshlanish',
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
      header: 'Tugash',
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
      header: 'Yaratilgan',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">E&apos;lonlar</h1>
          <p className="text-sm text-muted-foreground">
            Foydalanuvchilarga ko&apos;rsatiladigan e&apos;lonlarni boshqarish
          </p>
        </div>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          E&apos;lon qo&apos;shish
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
        emptyMessage="E'lonlar topilmadi"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "E'lonni tahrirlash" : "Yangi e'lon yaratish"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Sarlavha</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">UZ Lotin</Label>
                  <Input
                    value={form.titleUzLatin}
                    onChange={(e) => setForm((prev) => ({ ...prev, titleUzLatin: e.target.value }))}
                    placeholder="E'lon sarlavhasi (lotin)"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">UZ Kirill</Label>
                  <Input
                    value={form.titleUz}
                    onChange={(e) => setForm((prev) => ({ ...prev, titleUz: e.target.value }))}
                    placeholder="Эълон сарлавҳаси (кирилл)"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Рус</Label>
                  <Input
                    value={form.titleRu}
                    onChange={(e) => setForm((prev) => ({ ...prev, titleRu: e.target.value }))}
                    placeholder="Заголовок объявления"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Matn</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">UZ Lotin</Label>
                  <Textarea
                    value={form.contentUzLatin}
                    onChange={(e) => setForm((prev) => ({ ...prev, contentUzLatin: e.target.value }))}
                    placeholder="E'lon matni (lotin)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">UZ Kirill</Label>
                  <Textarea
                    value={form.contentUz}
                    onChange={(e) => setForm((prev) => ({ ...prev, contentUz: e.target.value }))}
                    placeholder="Эълон матни (кирилл)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Рус</Label>
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
                <Label>Turi</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, type: val as AnnouncementType }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Info">Ma&apos;lumot</SelectItem>
                    <SelectItem value="Warning">Ogohlantirish</SelectItem>
                    <SelectItem value="Important">Muhim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Holati</Label>
                <div className="flex items-center gap-2 h-8">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <span className="text-sm">{form.isActive ? 'Faol' : 'Nofaol'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ann-starts">Boshlanish sanasi</Label>
                <Input
                  id="ann-starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-expires">Tugash sanasi</Label>
                <Input
                  id="ann-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Ko&apos;rinishi</Label>
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
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : editingId ? 'Yangilash' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>E&apos;lonni o&apos;chirish</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu e&apos;lonni o&apos;chirishni tasdiqlaysizmi? Bu amalni qaytarib bo&apos;lmaydi.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
