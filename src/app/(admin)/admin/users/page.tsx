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


const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded h-96" />,
}) as ComponentType<DataTableProps<UserListItemDto>>;

export default function UsersPage() {
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
      toast.error(err instanceof Error ? err.message : 'Foydalanuvchilarni yuklashda xatolik');
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
      header: 'Ism',
      render: (user) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
        return <span className="font-medium">{name || '-'}</span>;
      },
    },
    {
      key: 'phone',
      header: 'Telefon',
      render: (user) => user.phoneNumber || '-',
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
        </Badge>
      ),
    },
    {
      key: 'authProvider',
      header: 'Auth',
      render: (user) => (
        <Badge variant="outline">{user.authProvider}</Badge>
      ),
    },
    {
      key: 'isBlocked',
      header: 'Holat',
      render: (user) =>
        user.isBlocked ? (
          <Badge variant="destructive">Bloklangan</Badge>
        ) : (
          <Badge variant="secondary">Faol</Badge>
        ),
    },
    {
      key: 'lastActiveAt',
      header: "So'nggi faollik",
      render: (user) =>
        user.lastActiveAt
          ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
          : '-',
    },
    {
      key: 'createdAt',
      header: "Ro'yxatdan o'tgan",
      render: (user) => format(new Date(user.createdAt), 'dd.MM.yyyy'),
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val as string)}>
          <SelectTrigger>
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha rollar</SelectItem>
            <SelectItem value="user">Foydalanuvchi</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={blockedFilter} onValueChange={(val) => setBlockedFilter(val as string)}>
          <SelectTrigger>
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="yes">Bloklangan</SelectItem>
            <SelectItem value="no">Faol</SelectItem>
          </SelectContent>
        </Select>
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
        emptyMessage="Foydalanuvchilar topilmadi"
      />
    </div>
  );
}
