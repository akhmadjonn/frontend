'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DataTable, { type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import type { AdminQuestionDto, CategoryDto, PaginatedList, LocalizedText } from '@/types/admin';
import { toast } from 'sonner';
import { Plus, Upload, Download, MoreHorizontal, Pencil, Trash2, Power, PowerOff, Search, ImageIcon } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { QuestionDrawer } from '@/components/admin/question-drawer';
import ImportDialog from '@/components/admin/import-dialog';
import DeleteDialog from '@/components/admin/delete-dialog';

interface FlatCategory {
  id: string;
  name: string;
  depth: number;
}

function flattenCategories(categories: CategoryDto[], language: keyof LocalizedText, depth = 0): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    result.push({
      id: cat.id,
      name: `${'— '.repeat(depth)}${cat.name[language] || cat.name.uzLatin}`,
      depth,
    });
    if (cat.children?.length)
      result.push(...flattenCategories(cat.children, language, depth + 1));
  }
  return result;
}

const DIFFICULTY_MAP: Record<number, { label: string; className: string }> = {
  1: { label: 'Oson', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  2: { label: "O'rta", className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  3: { label: 'Qiyin', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const PAGE_SIZE = 20;

export default function QuestionsManagementPage() {
  const { language } = useLocaleStore();
  const lang = language as keyof LocalizedText;

  // data
  const [questions, setQuestions] = useState<AdminQuestionDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [ticketNumber, setTicketNumber] = useState('');
  const [page, setPage] = useState(1);

  // selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // dialogs
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editQuestion, setEditQuestion] = useState<AdminQuestionDto | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'permanent'>('deactivate');
  const [rawCategories, setRawCategories] = useState<CategoryDto[]>([]);

  // toggling status per-question (optimistic tracking)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // debounce ref
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // fetch categories once
  useEffect(() => {
    apiClient
      .get<CategoryDto[]>('/categories')
      .then((data) => {
        setRawCategories(data);
        setCategories(flattenCategories(data, lang));
      })
      .catch(() => toast.error('Kategoriyalarni yuklashda xatolik'));
  }, [lang]);

  // fetch questions
  const fetchQuestions = useCallback(async () => {
    if (categoryId === 'all') {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(PAGE_SIZE));
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (difficulty !== 'all') params.set('difficulty', difficulty);
        if (status !== 'all') params.set('isActive', status === 'active' ? 'true' : 'false');
        if (ticketNumber) params.set('ticketNumber', ticketNumber);

        const data = await apiClient.get<PaginatedList<AdminQuestionDto>>(
          `/admin/questions?${params.toString()}`
        );
        setQuestions(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalCount(data.meta.totalCount);
      } catch {
        toast.error('Savollarni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      if (status !== 'all') params.set('isActive', status === 'active' ? 'true' : 'false');
      if (ticketNumber) params.set('ticketNumber', ticketNumber);

      const data = await apiClient.get<PaginatedList<AdminQuestionDto>>(
        `/admin/questions/by-category/${categoryId}?${params.toString()}`
      );
      setQuestions(data.items);
      setTotalPages(data.meta.totalPages);
      setTotalCount(data.meta.totalCount);
    } catch {
      toast.error('Savollarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, debouncedSearch, difficulty, status, ticketNumber]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [categoryId, difficulty, status, ticketNumber]);

  // toggle single question status
  const toggleStatus = async (question: AdminQuestionDto) => {
    const newStatus = !question.isActive;
    setTogglingIds((prev) => new Set([...prev, question.id]));

    // optimistic update
    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, isActive: newStatus } : q))
    );

    try {
      await apiClient.patch(`/admin/questions/${question.id}/status`, { isActive: newStatus });
      toast.success(newStatus ? 'Savol faollashtirildi' : 'Savol nofaol qilindi');
    } catch {
      // rollback
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, isActive: !newStatus } : q))
      );
      toast.error('Statusni o\'zgartirishda xatolik');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(question.id);
        return next;
      });
    }
  };

  // bulk toggle status
  const bulkToggleStatus = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;

    const questionIds = Array.from(selectedIds);

    // optimistic update
    setQuestions((prev) =>
      prev.map((q) => (selectedIds.has(q.id) ? { ...q, isActive } : q))
    );

    try {
      await apiClient.patch('/admin/questions/bulk-status', { questionIds, isActive });
      toast.success(
        isActive
          ? `${questionIds.length} ta savol faollashtirildi`
          : `${questionIds.length} ta savol nofaol qilindi`
      );
      setSelectedIds(new Set());
    } catch {
      // rollback by refetching
      fetchQuestions();
      toast.error('Ommaviy statusni o\'zgartirishda xatolik');
    }
  };

  // download template
  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228/api/v1'}/admin/questions/export-template`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Shablon yuklab olindi');
    } catch {
      toast.error('Shablonni yuklab olishda xatolik');
    }
  };

  // get text with language fallback
  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  // table columns
  const columns: Column<AdminQuestionDto>[] = [
    {
      key: 'thumbnail',
      header: 'Rasm',
      className: 'w-14',
      render: (q) =>
        q.thumbnailUrl ? (
          <img
            src={q.thumbnailUrl}
            alt=""
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        ),
    },
    {
      key: 'text',
      header: 'Savol matni',
      className: 'min-w-[200px] max-w-[400px]',
      render: (q) => (
        <span className="line-clamp-2 text-sm">{getText(q.text)}</span>
      ),
    },
    {
      key: 'category',
      header: 'Kategoriya',
      className: 'min-w-[120px]',
      render: (q) => (
        <span className="text-sm text-muted-foreground">{getText(q.categoryName)}</span>
      ),
    },
    {
      key: 'ticket',
      header: 'Bilet',
      className: 'w-16 text-center',
      render: (q) => (
        <span className="text-sm font-medium">{q.ticketNumber}</span>
      ),
    },
    {
      key: 'difficulty',
      header: 'Qiyinlik',
      className: 'w-20',
      render: (q) => {
        const diff = DIFFICULTY_MAP[q.difficulty];
        if (!diff) return null;
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${diff.className}`}>
            {diff.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-16',
      render: (q) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            size="sm"
            checked={q.isActive}
            onCheckedChange={() => toggleStatus(q)}
            disabled={togglingIds.has(q.id)}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (q) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditQuestion(q);
                  setShowCreateDrawer(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Tahrirlash
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setDeleteQuestionId(q.id);
                  setDeleteMode('deactivate');
                }}
              >
                <Trash2 className="h-4 w-4" />
                Nofaollashtirish
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteQuestionId(q.id);
                  setDeleteMode('permanent');
                }}
              >
                <Trash2 className="h-4 w-4" />
                Butunlay o&apos;chirish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savollar boshqaruvi</h1>
          <p className="text-sm text-muted-foreground">
            Jami: {totalCount} ta savol
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Shablon yuklab olish
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowCreateDrawer(true)}>
            <Plus className="h-4 w-4" />
            Savol qo&apos;shish
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Qidirish</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Savol matni bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Kategoriya</label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Barcha kategoriyalar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[120px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Qiyinlik</label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Barchasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="1">Oson</SelectItem>
              <SelectItem value="2">O&apos;rta</SelectItem>
              <SelectItem value="3">Qiyin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[120px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Barchasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Nofaol</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[100px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Bilet raqami</label>
          <Input
            type="number"
            min={1}
            placeholder="Bilet"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} ta savol tanlandi
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleStatus(true)}
            >
              <Power className="h-4 w-4" />
              Faollashtirish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleStatus(false)}
            >
              <PowerOff className="h-4 w-4" />
              Nofaol qilish
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            Bekor qilish
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={questions}
        loading={loading}
        emptyMessage="Savollar topilmadi"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        rowKey={(q) => q.id}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
      />

      <QuestionDrawer
        open={showCreateDrawer}
        onOpenChange={(open) => {
          setShowCreateDrawer(open);
          if (!open) setEditQuestion(null);
        }}
        question={editQuestion}
        categories={rawCategories}
        onSaved={fetchQuestions}
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImported={fetchQuestions}
      />

      <DeleteDialog
        open={!!deleteQuestionId}
        onOpenChange={(open) => { if (!open) setDeleteQuestionId(null); }}
        questionId={deleteQuestionId}
        onDeleted={fetchQuestions}
        mode={deleteMode}
      />
    </div>
  );
}
