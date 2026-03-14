'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { UserDetailDto } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Shield, ShieldOff, Ban, CheckCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';

type ConfirmAction = 'role' | 'block' | null;

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [pendingRole, setPendingRole] = useState<'user' | 'admin' | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<UserDetailDto>(`/admin/users/${id}`);
      setUser(result);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleRoleChange = async () => {
    if (!user || !pendingRole) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role: pendingRole });
      setUser({ ...user, role: pendingRole });
      toast.success(`Rol "${pendingRole === 'admin' ? 'Admin' : 'Foydalanuvchi'}" ga o'zgartirildi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rolni o'zgartirishda xatolik");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setPendingRole(null);
    }
  };

  const handleBlockToggle = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const newBlocked = !user.isBlocked;
      await apiClient.patch(`/admin/users/${id}/block`, { isBlocked: newBlocked });
      setUser({ ...user, isBlocked: newBlocked });
      toast.success(newBlocked ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi blokdan chiqarildi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Holatni ozgartirishda xatolik');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  if (loading)
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );

  if (notFound)
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Orqaga
        </Button>
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">Foydalanuvchi topilmadi</p>
        </div>
      </div>
    );

  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '-';
  const languageLabels: Record<string, string> = {
    uz: "O'zbek (Kirill)",
    uzLatin: "O'zbek (Lotin)",
    ru: 'Ruscha',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Orqaga
        </Button>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" disabled={actionLoading}>
                  <Shield className="mr-1.5 h-4 w-4" />
                  Rolni o'zgartirish
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={user.role === 'user'}
                onClick={() => {
                  setPendingRole('user');
                  setConfirmAction('role');
                }}
              >
                <ShieldOff className="mr-1.5 h-4 w-4" />
                Foydalanuvchi
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={user.role === 'admin'}
                onClick={() => {
                  setPendingRole('admin');
                  setConfirmAction('role');
                }}
              >
                <Shield className="mr-1.5 h-4 w-4" />
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={user.isBlocked ? 'outline' : 'destructive'}
            disabled={actionLoading}
            onClick={() => setConfirmAction('block')}
          >
            {user.isBlocked ? (
              <>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Blokdan chiqarish
              </>
            ) : (
              <>
                <Ban className="mr-1.5 h-4 w-4" />
                Bloklash
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Ism" value={fullName} />
              <DetailRow label="Telefon" value={user.phoneNumber || '-'} />
              <DetailRow
                label="Rol"
                value={
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
                  </Badge>
                }
              />
              <DetailRow
                label="Auth"
                value={<Badge variant="outline">{user.authProvider}</Badge>}
              />
              <DetailRow label="Til" value={languageLabels[user.preferredLanguage] ?? user.preferredLanguage} />
              <DetailRow label="Telegram ID" value={user.telegramId ? String(user.telegramId) : '-'} />
              <DetailRow
                label="Holat"
                value={
                  user.isBlocked ? (
                    <Badge variant="destructive">Bloklangan</Badge>
                  ) : (
                    <Badge variant="secondary">Faol</Badge>
                  )
                }
              />
              <DetailRow
                label="So'nggi faollik"
                value={
                  user.lastActiveAt
                    ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                    : '-'
                }
              />
              <DetailRow
                label="Ro'yxatdan o'tgan"
                value={format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm')}
              />
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {user.activeSubscription && (
            <Card>
              <CardHeader>
                <CardTitle>Obuna</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <DetailRow label="Reja" value={user.activeSubscription.planName} />
                  <DetailRow
                    label="Holat"
                    value={
                      <Badge variant="default">{user.activeSubscription.status}</Badge>
                    }
                  />
                  <DetailRow
                    label="Tugash sanasi"
                    value={format(new Date(user.activeSubscription.expiresAt), 'dd.MM.yyyy HH:mm')}
                  />
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Statistika</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <DetailRow label="Jami imtihonlar" value={String(user.totalExams)} />
                <DetailRow label="Yakunlangan" value={String(user.completedExams)} />
                <DetailRow
                  label="O'rtacha ball"
                  value={`${Math.round(user.averageScore)}%`}
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={confirmAction === 'role'}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setPendingRole(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolni o'zgartirish</DialogTitle>
            <DialogDescription>
              {fullName} uchun rolni &quot;{pendingRole === 'admin' ? 'Admin' : 'Foydalanuvchi'}&quot; ga
              o'zgartirmoqchimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmAction(null); setPendingRole(null); }}>
              Bekor qilish
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading}>
              {actionLoading ? 'Saqlanmoqda...' : 'Tasdiqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmAction === 'block'}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}</DialogTitle>
            <DialogDescription>
              {fullName} ni {user.isBlocked ? 'blokdan chiqarmoqchimisiz' : 'bloklashni xohlaysizmi'}?
              {!user.isBlocked && " Bloklangan foydalanuvchi tizimga kira olmaydi."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Bekor qilish
            </Button>
            <Button
              variant={user.isBlocked ? 'default' : 'destructive'}
              onClick={handleBlockToggle}
              disabled={actionLoading}
            >
              {actionLoading ? 'Saqlanmoqda...' : 'Tasdiqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
