'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { type Column, type DataTableProps } from '@/components/admin/data-table';
import { apiClient } from '@/lib/api-client';
import type { AuditLogDto, PaginatedList } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';


const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded h-96" />,
}) as ComponentType<DataTableProps<AuditLogDto & { _isDetail?: boolean }>>;

const ACTION_BADGE_MAP: Record<string, { label: string; className: string }> = {
  Create: {
    label: 'Create',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  Update: {
    label: 'Update',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  Delete: {
    label: 'Delete',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  StatusChange: {
    label: 'Status',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  Login: {
    label: 'Login',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
  Export: {
    label: 'Export',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

const ACTION_OPTIONS = ['Create', 'Update', 'Delete', 'StatusChange', 'Login', 'Export'];
const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const [data, setData] = useState<PaginatedList<AuditLogDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [debouncedEntityType, setDebouncedEntityType] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEntityType(entityTypeFilter);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [entityTypeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (debouncedEntityType) params.set('entityType', debouncedEntityType);
      if (debouncedUserSearch) params.set('userSearch', debouncedUserSearch);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const result = await apiClient.get<PaginatedList<AuditLogDto>>(
        `/admin/audit-logs?${params.toString()}`
      );
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit loglarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, debouncedEntityType, debouncedUserSearch, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, dateFrom, dateTo]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderActionBadge = (action: string) => {
    const config = ACTION_BADGE_MAP[action];
    if (config)
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
      );
    return <Badge variant="outline">{action}</Badge>;
  };

  const hasChanges = (log: AuditLogDto) =>
    log.oldValues !== null || log.newValues !== null;

  const columns: Column<AuditLogDto>[] = [
    {
      key: 'expand',
      header: '',
      className: 'w-8',
      render: (log) => {
        if (!hasChanges(log)) return null;
        const isExpanded = expandedRows.has(log.id);
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleRow(log.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      },
    },
    {
      key: 'user',
      header: 'Foydalanuvchi',
      className: 'min-w-[120px]',
      render: (log) => (
        <span className="text-sm font-medium">{log.userName || log.userId.slice(0, 8)}</span>
      ),
    },
    {
      key: 'action',
      header: 'Harakat',
      className: 'w-24',
      render: (log) => renderActionBadge(log.action),
    },
    {
      key: 'entityType',
      header: 'Turi',
      className: 'min-w-[100px]',
      render: (log) => <span className="text-sm">{log.entityType}</span>,
    },
    {
      key: 'entityId',
      header: 'ID',
      className: 'min-w-[80px]',
      render: (log) => (
        <span className="text-xs font-mono text-muted-foreground">
          {log.entityId ? log.entityId.slice(0, 8) : '-'}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP manzil',
      className: 'min-w-[110px]',
      render: (log) => (
        <span className="text-xs font-mono text-muted-foreground">
          {log.ipAddress || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Sana',
      className: 'min-w-[140px]',
      render: (log) => (
        <span className="text-sm">
          {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm')}
        </span>
      ),
    },
  ];

  const items = data?.items ?? [];

  const tableData = items.flatMap((log) => {
    const rows: (AuditLogDto & { _isDetail?: boolean })[] = [log];
    if (expandedRows.has(log.id) && hasChanges(log))
      rows.push({ ...log, _isDetail: true, id: `${log.id}_detail` });
    return rows;
  });

  const detailColumns: Column<AuditLogDto & { _isDetail?: boolean }>[] = columns.map((col) => ({
    ...col,
    render: (item: AuditLogDto & { _isDetail?: boolean }) => {
      if (item._isDetail) {
        if (col.key === 'expand') return null;
        if (col.key === 'user')
          return (
            <div className="col-span-full space-y-3 py-2" style={{ gridColumn: '1 / -1' }}>
              <div className="grid gap-3 sm:grid-cols-2">
                {item.oldValues !== null && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Oldingi qiymatlar
                    </p>
                    <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                      {JSON.stringify(item.oldValues, null, 2)}
                    </pre>
                  </div>
                )}
                {item.newValues !== null && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Yangi qiymatlar
                    </p>
                    <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                      {JSON.stringify(item.newValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        return null;
      }
      return col.render(item);
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Tizim harakatlari jurnali
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Harakat turi</label>
          <Select value={actionFilter} onValueChange={(val) => setActionFilter(val ?? 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Barchasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {ACTION_OPTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Entity turi</label>
          <Input
            placeholder="Masalan: Question"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
          />
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Foydalanuvchi</label>
          <Input
            placeholder="Ism yoki ID"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Sanadan</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Sanagacha</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={detailColumns}
        data={tableData}
        loading={loading}
        rowKey={(item) => item.id}
        onRowClick={(item) => {
          if (!item._isDetail && hasChanges(item)) toggleRow(item.id);
        }}
        page={page}
        totalPages={data?.meta.totalPages}
        onPageChange={setPage}
        emptyMessage="Audit loglar topilmadi"
      />
    </div>
  );
}
