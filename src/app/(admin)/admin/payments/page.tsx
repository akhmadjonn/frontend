'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/admin/data-table';
import StatCard from '@/components/admin/stat-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import type { PaymentTransactionDto, RevenueReportDto, PaginatedList } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { useLocale } from '@/hooks/use-locale';
import { useLocaleStore } from '@/stores/locale-store';

const RevenueChart = dynamic(() => import('@/components/admin/revenue-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228/api/v1';

const formatMoney = (tiyins: number) =>
  `${(tiyins / 100).toLocaleString('uz-UZ')} so'm`;

const STATUS_STYLES: Record<string, { dotColor: string; textColor: string }> = {
  completed: { dotColor: 'bg-green-500', textColor: 'text-green-700 dark:text-green-400' },
  Completed: { dotColor: 'bg-green-500', textColor: 'text-green-700 dark:text-green-400' },
  pending: { dotColor: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-400' },
  Pending: { dotColor: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-400' },
  failed: { dotColor: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400' },
  Failed: { dotColor: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400' },
  refunded: { dotColor: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
  Refunded: { dotColor: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
};

const PROVIDER_STYLES: Record<string, string> = {
  payme: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Payme: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  click: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Click: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  manual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Manual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const PROVIDER_LABELS: Record<string, string> = {
  payme: 'Payme', Payme: 'Payme',
  click: 'Click', Click: 'Click',
  manual: 'Premium', Manual: 'Premium',
};


function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles = STATUS_STYLES[status] ?? { dotColor: 'bg-gray-400', textColor: 'text-muted-foreground' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${styles.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dotColor}`} />
      {label}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const className = PROVIDER_STYLES[provider] ?? '';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{PROVIDER_LABELS[provider] ?? provider}</span>;
}

function TransactionsTab() {
  const { ts } = useLocale();
  const [data, setData] = useState<PaginatedList<PaymentTransactionDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const STATUS_LABELS: Record<string, string> = {
    completed: ts('admin.payments.statusCompleted'),
    Completed: ts('admin.payments.statusCompleted'),
    pending: ts('admin.payments.statusPending'),
    Pending: ts('admin.payments.statusPending'),
    failed: ts('admin.payments.statusFailed'),
    Failed: ts('admin.payments.statusFailed'),
    refunded: ts('admin.payments.statusRefunded'),
    Refunded: ts('admin.payments.statusRefunded'),
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (searchDebounce) params.set('search', searchDebounce);
      if (providerFilter !== 'all') params.set('provider', providerFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const result = await apiClient.get<PaginatedList<PaymentTransactionDto>>(
        `/admin/payments/transactions?${params.toString()}`
      );
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.payments.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce, providerFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounce, providerFilter, statusFilter, dateFrom, dateTo]);

  const columns: Column<PaymentTransactionDto>[] = [
    {
      key: 'userPhone',
      header: ts('admin.payments.phone'),
      render: (tx) => (
        <span className="font-medium">{tx.userPhone || '-'}</span>
      ),
    },
    {
      key: 'provider',
      header: ts('admin.payments.provider'),
      render: (tx) => <ProviderBadge provider={tx.provider} />,
    },
    {
      key: 'amount',
      header: ts('admin.payments.amount'),
      render: (tx) => (
        <span className="font-medium">{formatMoney(tx.amountInTiyins)}</span>
      ),
    },
    {
      key: 'status',
      header: ts('admin.payments.status'),
      render: (tx) => <StatusBadge status={tx.status} label={STATUS_LABELS[tx.status] ?? tx.status} />,
    },
    {
      key: 'createdAt',
      header: ts('admin.payments.date'),
      render: (tx) => format(new Date(tx.createdAt), 'dd.MM.yyyy HH:mm'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('common.search')}</label>
          <Input
            placeholder={ts('admin.payments.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl h-11"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.payments.provider')}</label>
          <Select value={providerFilter} onValueChange={(v) => setProviderFilter(v ?? 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {providerFilter === 'all' ? ts('admin.payments.allProviders') : providerFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ts('admin.payments.allProviders')}</SelectItem>
              <SelectItem value="Payme">Payme</SelectItem>
              <SelectItem value="Click">Click</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.payments.status')}</label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {statusFilter === 'all' ? ts('admin.payments.allStatuses') : STATUS_LABELS[statusFilter] ?? statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ts('admin.payments.allStatuses')}</SelectItem>
              <SelectItem value="Completed">{ts('admin.payments.statusCompleted')}</SelectItem>
              <SelectItem value="Pending">{ts('admin.payments.statusPending')}</SelectItem>
              <SelectItem value="Failed">{ts('admin.payments.statusFailed')}</SelectItem>
              <SelectItem value="Refunded">{ts('admin.payments.statusRefunded')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.payments.dateFrom')}</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto"
            />
          </div>
          <span className="text-sm text-muted-foreground mt-5">—</span>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.payments.dateTo')}</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={loading}
        rowKey={(tx) => tx.id}
        page={page}
        totalPages={data?.meta.totalPages}
        onPageChange={setPage}
        emptyMessage={ts('admin.payments.notFound')}
      />
    </div>
  );
}

function RevenueTab() {
  const { ts } = useLocale();
  const [revenue, setRevenue] = useState<RevenueReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const queryStr = params.toString();
      const result = await apiClient.get<RevenueReportDto>(
        `/admin/payments/revenue${queryStr ? `?${queryStr}` : ''}`
      );
      setRevenue(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.payments.revenueLoadError'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const queryStr = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/admin/payments/revenue/export${queryStr ? `?${queryStr}` : ''}`,
        {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok)
        throw new Error(ts('admin.payments.exportError'));

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'revenue-report.xlsx';
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/);
        if (match?.[1]) filename = match[1];
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(ts('admin.payments.fileDownloaded'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.payments.exportError'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? ts('admin.payments.downloading') : ts('admin.payments.excelExport')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={ts('admin.payments.totalRevenue')}
          value={loading ? 0 : formatMoney(revenue?.totalRevenue ?? 0)}
          icon={DollarSign}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          description={`${revenue?.totalTransactions ?? 0} ${ts('admin.payments.transactions')}`}
          loading={loading}
        />
        <StatCard
          title={ts('admin.payments.completed')}
          value={loading ? 0 : (revenue?.completedTransactions ?? 0).toLocaleString()}
          icon={CheckCircle}
          iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          loading={loading}
        />
        <StatCard
          title={ts('admin.payments.failed')}
          value={loading ? 0 : (revenue?.failedTransactions ?? 0).toLocaleString()}
          icon={XCircle}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          loading={loading}
        />
        <StatCard
          title={ts('admin.payments.paymeRevenue')}
          value={loading ? 0 : formatMoney(revenue?.paymeRevenue ?? 0)}
          icon={DollarSign}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title={ts('admin.payments.clickRevenue')}
          value={loading ? 0 : formatMoney(revenue?.clickRevenue ?? 0)}
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          loading={loading}
        />
      </div>

      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold mb-4">{ts('admin.payments.dailyRevenue')}</h3>
        <RevenueChart data={revenue?.dailyBreakdown} loading={loading} />
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { ts } = useLocale();

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.payments.title')}</h1>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.payments.transactionsTab')}</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.payments.revenueTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
