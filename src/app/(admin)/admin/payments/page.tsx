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

const RevenueChart = dynamic(() => import('@/components/admin/revenue-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228/api/v1';

const formatMoney = (tiyins: number) =>
  `${(tiyins / 100).toLocaleString('uz-UZ')} so'm`;

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; textColor: string }> = {
  Completed: { label: 'Bajarildi', dotColor: 'bg-green-500', textColor: 'text-green-700 dark:text-green-400' },
  Pending: { label: 'Kutilmoqda', dotColor: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-400' },
  Failed: { label: 'Muvaffaqiyatsiz', dotColor: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400' },
  Refunded: { label: 'Qaytarildi', dotColor: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
};

const PROVIDER_CONFIG: Record<string, { label: string; className: string }> = {
  Payme: { label: 'Payme', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  Click: { label: 'Click', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, dotColor: 'bg-gray-400', textColor: 'text-muted-foreground' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const config = PROVIDER_CONFIG[provider] ?? { label: provider, className: '' };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>{config.label}</span>;
}

function TransactionsTab() {
  const [data, setData] = useState<PaginatedList<PaymentTransactionDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
      toast.error(err instanceof Error ? err.message : 'Tranzaksiyalarni yuklashda xatolik');
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
      header: 'Telefon',
      render: (tx) => (
        <span className="font-medium">{tx.userPhone || '-'}</span>
      ),
    },
    {
      key: 'provider',
      header: 'Provayder',
      render: (tx) => <ProviderBadge provider={tx.provider} />,
    },
    {
      key: 'amount',
      header: 'Summa',
      render: (tx) => (
        <span className="font-medium">{formatMoney(tx.amountInTiyins)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      render: (tx) => <StatusBadge status={tx.status} />,
    },
    {
      key: 'createdAt',
      header: 'Sana',
      render: (tx) => format(new Date(tx.createdAt), 'dd.MM.yyyy HH:mm'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Qidirish</label>
          <Input
            placeholder="Telefon raqami..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Provayder</label>
          <Select value={providerFilter} onValueChange={(v) => setProviderFilter(v ?? 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Provayder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha provayderlar</SelectItem>
              <SelectItem value="Payme">Payme</SelectItem>
              <SelectItem value="Click">Click</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Holat</label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="Completed">Bajarildi</SelectItem>
              <SelectItem value="Pending">Kutilmoqda</SelectItem>
              <SelectItem value="Failed">Muvaffaqiyatsiz</SelectItem>
              <SelectItem value="Refunded">Qaytarildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sanadan</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto"
            />
          </div>
          <span className="text-sm text-muted-foreground mt-5">—</span>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sanagacha</label>
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
        emptyMessage="Tranzaksiyalar topilmadi"
      />
    </div>
  );
}

function RevenueTab() {
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
      toast.error(err instanceof Error ? err.message : 'Hisobotni yuklashda xatolik');
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
        throw new Error('Eksport qilishda xatolik');

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

      toast.success('Fayl yuklandi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Eksport qilishda xatolik');
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
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Yuklanmoqda...' : 'Excel eksport'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Umumiy daromad"
          value={loading ? 0 : formatMoney(revenue?.totalRevenue ?? 0)}
          icon={DollarSign}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          description={`${revenue?.totalTransactions ?? 0} ta tranzaksiya`}
          loading={loading}
        />
        <StatCard
          title="Bajarilgan"
          value={loading ? 0 : (revenue?.completedTransactions ?? 0).toLocaleString()}
          icon={CheckCircle}
          iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          loading={loading}
        />
        <StatCard
          title="Muvaffaqiyatsiz"
          value={loading ? 0 : (revenue?.failedTransactions ?? 0).toLocaleString()}
          icon={XCircle}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          loading={loading}
        />
        <StatCard
          title="Payme daromadi"
          value={loading ? 0 : formatMoney(revenue?.paymeRevenue ?? 0)}
          icon={DollarSign}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title="Click daromadi"
          value={loading ? 0 : formatMoney(revenue?.clickRevenue ?? 0)}
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kunlik daromad</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenue?.dailyBreakdown} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">To&apos;lovlar</h1>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
          <TabsTrigger value="revenue">Daromad hisoboti</TabsTrigger>
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
