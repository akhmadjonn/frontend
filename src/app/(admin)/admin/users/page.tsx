'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { type Column, type DataTableProps } from '@/components/admin/data-table';
import { apiClient } from '@/lib/api-client';
import type { UserListItemDto, PaginatedList } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { useLocale } from '@/hooks/use-locale';


const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded h-96" />,
}) as ComponentType<DataTableProps<UserListItemDto>>;

export default function UsersPage() {
  const { ts } = useLocale();
  const router = useRouter();
  const [data, setData] = useState<PaginatedList<UserListItemDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [blockedFilter, setBlockedFilter] = useState<string>('all');
  const [searchDebounce, setSearchDebounce] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (searchDebounce) params.set('search', searchDebounce);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (blockedFilter !== 'all') params.set('isBlocked', blockedFilter === 'yes' ? 'true' : 'false');

      const result = await apiClient.get<PaginatedList<UserListItemDto>>(`/admin/users?${params.toString()}`);
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.users.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce, roleFilter, blockedFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounce, roleFilter, blockedFilter]);

  const columns: Column<UserListItemDto>[] = [
    {
      key: 'name',
      header: ts('admin.users.name'),
      render: (user) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
        return <span className="font-medium">{name || '-'}</span>;
      },
    },
    {
      key: 'phone',
      header: ts('admin.users.phone'),
      render: (user) => user.phoneNumber || '-',
    },
    {
      key: 'role',
      header: ts('admin.users.role'),
      render: (user) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role === 'admin' ? ts('admin.users.admin') : ts('admin.users.user')}
        </Badge>
      ),
    },
    {
      key: 'authProvider',
      header: ts('admin.users.auth'),
      render: (user) => (
        <Badge variant="outline">{user.authProvider}</Badge>
      ),
    },
    {
      key: 'isBlocked',
      header: ts('admin.users.status'),
      render: (user) =>
        user.isBlocked ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {ts('admin.users.blocked')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {ts('admin.active')}
          </span>
        ),
    },
    {
      key: 'lastActiveAt',
      header: ts('admin.users.lastActive'),
      render: (user) =>
        user.lastActiveAt
          ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
          : '-',
    },
    {
      key: 'createdAt',
      header: ts('admin.users.registeredAt'),
      render: (user) => format(new Date(user.createdAt), 'dd.MM.yyyy'),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">{ts('admin.users.title')}</h1>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('common.search')}</label>
          <Input
            placeholder={ts('admin.users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.users.role')}</label>
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={ts('admin.users.role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ts('admin.users.allRoles')}</SelectItem>
              <SelectItem value="user">{ts('admin.users.user')}</SelectItem>
              <SelectItem value="admin">{ts('admin.users.admin')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{ts('admin.users.status')}</label>
          <Select value={blockedFilter} onValueChange={(val) => setBlockedFilter(val as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={ts('admin.users.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ts('admin.users.allStatuses')}</SelectItem>
              <SelectItem value="yes">{ts('admin.users.blocked')}</SelectItem>
              <SelectItem value="no">{ts('admin.active')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={loading}
        rowKey={(user) => user.id}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
        page={page}
        totalPages={data?.meta.totalPages}
        onPageChange={setPage}
        emptyMessage={ts('admin.users.notFound')}
      />
    </div>
  );
}
