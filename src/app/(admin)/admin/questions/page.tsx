'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { type Column, type DataTableProps } from '@/components/admin/data-table';
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
import { useLocale } from '@/hooks/use-locale';


const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded h-96" />,
}) as ComponentType<DataTableProps<AdminQuestionDto>>;

const QuestionDrawer = dynamic(
  () => import('@/components/admin/question-drawer').then((m) => m.QuestionDrawer),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded h-96" /> }
);

const ImportDialog = dynamic(() => import('@/components/admin/import-dialog'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded h-96" />,
});

const DeleteDialog = dynamic(() => import('@/components/admin/delete-dialog'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded h-96" />,
});

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

const DIFFICULTY_CLASSES: Record<string, string> = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  2: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  3: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const PAGE_SIZE = 20;

export default function QuestionsManagementPage() {
  const { language } = useLocaleStore();
  const { ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const DIFFICULTY_MAP: Record<string, { label: string; className: string }> = {
    1: { label: ts('admin.questions.easy'), className: DIFFICULTY_CLASSES[1] },
    2: { label: ts('admin.questions.medium'), className: DIFFICULTY_CLASSES[2] },
    3: { label: ts('admin.questions.hard'), className: DIFFICULTY_CLASSES[3] },
    easy: { label: ts('admin.questions.easy'), className: DIFFICULTY_CLASSES.easy },
    medium: { label: ts('admin.questions.medium'), className: DIFFICULTY_CLASSES.medium },
    hard: { label: ts('admin.questions.hard'), className: DIFFICULTY_CLASSES.hard },
  };

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
      .catch(() => toast.error(ts('admin.questions.categoriesLoadError')));
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
        if (status !== 'all') params.set('status', status);
        if (ticketNumber) params.set('ticketNumber', ticketNumber);

        const data = await apiClient.get<PaginatedList<AdminQuestionDto>>(
          `/admin/questions?${params.toString()}`
        );
        setQuestions(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalCount(data.meta.totalCount);
      } catch {
        toast.error(ts('admin.questions.loadError'));
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
      if (status !== 'all') params.set('status', status);
      if (ticketNumber) params.set('ticketNumber', ticketNumber);

      const data = await apiClient.get<PaginatedList<AdminQuestionDto>>(
        `/admin/questions/by-category/${categoryId}?${params.toString()}`
      );
      setQuestions(data.items);
      setTotalPages(data.meta.totalPages);
      setTotalCount(data.meta.totalCount);
    } catch {
      toast.error(ts('admin.questions.loadError'));
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
    const newStatus = question.status === 'active' ? 'inactive' : 'active';
    setTogglingIds((prev) => new Set([...prev, question.id]));

    // optimistic update
    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, status: newStatus as AdminQuestionDto['status'] } : q))
    );

    try {
      await apiClient.patch(`/admin/questions/${question.id}/status`, { status: newStatus });
      toast.success(newStatus === 'active' ? ts('admin.questions.activated') : ts('admin.questions.deactivated'));
    } catch {
      // rollback
      const rollback = newStatus === 'active' ? 'inactive' : 'active';
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, status: rollback as AdminQuestionDto['status'] } : q))
      );
      toast.error(ts('admin.questions.statusError'));
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(question.id);
        return next;
      });
    }
  };

  // bulk toggle status
  const bulkToggleStatus = async (activate: boolean) => {
    if (selectedIds.size === 0) return;

    const questionIds = Array.from(selectedIds);
    const newStatus = activate ? 'active' : 'inactive';

    // optimistic update
    setQuestions((prev) =>
      prev.map((q) => (selectedIds.has(q.id) ? { ...q, status: newStatus as AdminQuestionDto['status'] } : q))
    );

    try {
      await apiClient.patch('/admin/questions/bulk-status', { questionIds, status: newStatus });
      toast.success(
        activate
          ? `${questionIds.length} ${ts('admin.questions.bulkActivated')}`
          : `${questionIds.length} ${ts('admin.questions.bulkDeactivated')}`
      );
      setSelectedIds(new Set());
    } catch {
      // rollback by refetching
      fetchQuestions();
      toast.error(ts('admin.questions.bulkStatusError'));
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
      toast.success(ts('admin.questions.templateDownloaded'));
    } catch {
      toast.error(ts('admin.questions.templateDownloadError'));
    }
  };

  // get text with language fallback
  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  // table columns
  const columns: Column<AdminQuestionDto>[] = [
    {
      key: 'thumbnail',
      header: ts('admin.questions.image'),
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
      header: ts('admin.questions.questionText'),
      className: 'min-w-[200px] max-w-[400px]',
      render: (q) => (
        <span className="line-clamp-2 text-sm">{getText(q.text)}</span>
      ),
    },
    {
      key: 'category',
      header: ts('admin.questions.category'),
      className: 'min-w-[120px]',
      render: (q) => (
        <span className="text-sm text-muted-foreground">{getText(q.categoryName)}</span>
      ),
    },
    {
      key: 'ticket',
      header: ts('admin.questions.ticket'),
      className: 'w-16 text-center',
      render: (q) => (
        <span className="text-sm font-medium">{q.ticketNumber}</span>
      ),
    },
    {
      key: 'difficulty',
      header: ts('admin.questions.difficulty'),
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
      header: ts('admin.questions.status'),
      className: 'w-16',
      render: (q) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            size="sm"
            checked={q.status === 'active'}
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
                {ts('admin.questions.editBtn')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setDeleteQuestionId(q.id);
                  setDeleteMode('deactivate');
                }}
              >
                <Trash2 className="h-4 w-4" />
                {ts('admin.questions.deactivateBtn')}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteQuestionId(q.id);
                  setDeleteMode('permanent');
                }}
              >
                <Trash2 className="h-4 w-4" />
                {ts('admin.questions.deleteForever')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.questions.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {ts('common.total')}: {totalCount} {ts('common.question')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            {ts('admin.questions.downloadTemplate')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4" />
            {ts('admin.questions.import')}
          </Button>
          <Button size="sm" className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={() => setShowCreateDrawer(true)}>
            <Plus className="h-4 w-4" />
            {ts('admin.questions.addQuestion')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('common.search')}</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={ts('admin.questions.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 rounded-xl h-11"
            />
          </div>
        </div>

        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.questions.category')}</label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder={ts('admin.questions.allCategories')}>
                {categoryId === 'all' ? ts('admin.questions.allCategories') : categories.find(c => c.id === categoryId)?.name ?? ts('admin.questions.allCategories')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ts('admin.questions.allCategories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[120px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.questions.difficulty')}</label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={ts('common.all')}>
                {difficulty === 'all' ? ts('common.all') : difficulty === '1' ? ts('admin.questions.easy') : difficulty === '2' ? ts('admin.questions.medium') : ts('admin.questions.hard')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ts('common.all')}</SelectItem>
              <SelectItem value="1">{ts('admin.questions.easy')}</SelectItem>
              <SelectItem value="2">{ts('admin.questions.medium')}</SelectItem>
              <SelectItem value="3">{ts('admin.questions.hard')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[120px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.questions.status')}</label>
          <Select value={status} onValueChange={(v) => setStatus(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={ts('common.all')}>
                {status === 'all' ? ts('common.all') : status === 'active' ? ts('admin.active') : ts('admin.inactive')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ts('common.all')}</SelectItem>
              <SelectItem value="active">{ts('admin.active')}</SelectItem>
              <SelectItem value="inactive">{ts('admin.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[100px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.questions.ticketNumber')}</label>
          <Input
            type="number"
            min={1}
            placeholder={ts('admin.questions.ticket')}
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900 dark:bg-blue-950/30">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {selectedIds.size} {ts('admin.questions.selectedCount')}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleStatus(true)}
              className="rounded-xl border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              <Power className="h-4 w-4" />
              {ts('admin.questions.activate')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleStatus(false)}
              className="rounded-xl border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <PowerOff className="h-4 w-4" />
              {ts('admin.questions.deactivate')}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            {ts('common.cancel')}
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={questions}
        loading={loading}
        emptyMessage={ts('admin.questions.notFound')}
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
