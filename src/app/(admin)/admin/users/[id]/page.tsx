'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { UserDetailDto, GrantPremiumResultDto } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ArrowLeft, Shield, ShieldOff, Ban, CheckCircle, Crown, Clock, XCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { useLocale } from '@/hooks/use-locale';

type ConfirmAction = 'role' | 'block' | 'revoke' | null;
type DurationOption = '30' | '90' | '365' | 'forever' | 'custom';

interface PlanOption {
  id: string;
  name: string;
}

export default function UserDetailPage() {
  const { ts } = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [pendingRole, setPendingRole] = useState<'user' | 'admin' | null>(null);

  // Grant premium state
  const [grantOpen, setGrantOpen] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [durationOption, setDurationOption] = useState<DurationOption>('30');
  const [customDays, setCustomDays] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

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

  const fetchPlans = useCallback(async () => {
    try {
      const result = await apiClient.get<Array<{ id: string; nameUzLatin: string }>>('/admin/plans');
      const mapped = (Array.isArray(result) ? result : []).map(p => ({ id: p.id, name: p.nameUzLatin }));
      setPlans(mapped);
    } catch {
      // plans load failed silently
    }
  }, []);

  const handleRoleChange = async () => {
    if (!user || !pendingRole) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role: pendingRole });
      setUser({ ...user, role: pendingRole });
      toast.success(`${pendingRole === 'admin' ? ts('admin.users.admin') : ts('admin.users.user')} ${ts('admin.userDetail.roleChanged')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.userDetail.roleChangeError'));
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
      toast.success(newBlocked ? ts('admin.userDetail.userBlocked') : ts('admin.userDetail.userUnblocked'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.userDetail.blockError'));
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const openGrantDialog = () => {
    fetchPlans();
    setSelectedPlanId('');
    setDurationOption('30');
    setCustomDays('');
    setGrantNote('');
    setGrantOpen(true);
  };

  const handleGrantPremium = async () => {
    if (!selectedPlanId) return;
    setGrantLoading(true);
    try {
      const durationDays = durationOption === 'forever'
        ? null
        : durationOption === 'custom'
          ? parseInt(customDays, 10)
          : parseInt(durationOption, 10);

      if (durationOption === 'custom' && (!durationDays || durationDays <= 0)) {
        toast.error(ts('admin.userDetail.duration'));
        setGrantLoading(false);
        return;
      }

      await apiClient.post<GrantPremiumResultDto>(`/admin/users/${id}/premium`, {
        planId: selectedPlanId,
        durationDays,
        note: grantNote || null,
      });

      toast.success(
        user?.activeSubscription
          ? ts('admin.userDetail.extendSuccess')
          : ts('admin.userDetail.grantSuccess')
      );
      setGrantOpen(false);
      await fetchUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.userDetail.grantSuccess'));
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevokePremium = async () => {
    setActionLoading(true);
    try {
      await apiClient.delete(`/admin/users/${id}/premium`);
      toast.success(ts('admin.userDetail.revokeSuccess'));
      setConfirmAction(null);
      await fetchUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.userDetail.blockError'));
    } finally {
      setActionLoading(false);
    }
  };

  const getProviderLabel = (provider: string | null) => {
    switch (provider?.toLowerCase()) {
      case 'manual': return ts('admin.userDetail.sourceManual');
      case 'payme': return ts('admin.userDetail.sourcePayme');
      case 'click': return ts('admin.userDetail.sourceClick');
      default: return '-';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Badge variant="default">{ts('admin.active')}</Badge>;
      case 'expired': return <Badge variant="secondary">{status}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isForeverDate = (dateStr: string) => new Date(dateStr).getFullYear() >= 2099;

  if (loading)
    return (
      <div className="container mx-auto p-6 space-y-6 animate-fade-up">
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
      <div className="container mx-auto p-6 space-y-6 animate-fade-up">
        <Button variant="ghost" className="rounded-xl" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {ts('common.back')}
        </Button>
        <div className="rounded-xl border py-12 text-center">
          <p className="text-muted-foreground">{ts('admin.userDetail.notFound')}</p>
        </div>
      </div>
    );

  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '-';
  const languageLabels: Record<string, string> = {
    uz: ts('admin.userDetail.langUzCyrillic'),
    uzLatin: ts('admin.userDetail.langUzLatin'),
    ru: ts('admin.userDetail.langRu'),
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="rounded-xl" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {ts('common.back')}
        </Button>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="rounded-xl" disabled={actionLoading}>
                  <Shield className="mr-1.5 h-4 w-4" />
                  {ts('admin.userDetail.changeRole')}
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
                {ts('admin.users.user')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={user.role === 'admin'}
                onClick={() => {
                  setPendingRole('admin');
                  setConfirmAction('role');
                }}
              >
                <Shield className="mr-1.5 h-4 w-4" />
                {ts('admin.users.admin')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={user.isBlocked ? 'outline' : 'destructive'}
            className="rounded-xl"
            disabled={actionLoading}
            onClick={() => setConfirmAction('block')}
          >
            {user.isBlocked ? (
              <>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                {ts('admin.userDetail.unblock')}
              </>
            ) : (
              <>
                <Ban className="mr-1.5 h-4 w-4" />
                {ts('admin.userDetail.block')}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold mb-4">{ts('admin.userDetail.profile')}</h3>
          <div>
            <dl className="space-y-3 text-sm">
              <DetailRow label={ts('admin.users.name')} value={fullName} />
              <DetailRow label={ts('admin.users.phone')} value={user.phoneNumber || '-'} />
              <DetailRow
                label={ts('admin.users.role')}
                value={
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? ts('admin.users.admin') : ts('admin.users.user')}
                  </Badge>
                }
              />
              <DetailRow
                label={ts('admin.users.auth')}
                value={<Badge variant="outline">{user.authProvider}</Badge>}
              />
              <DetailRow label={ts('admin.userDetail.language')} value={languageLabels[user.preferredLanguage] ?? user.preferredLanguage} />
              <DetailRow label={ts('admin.userDetail.telegramId')} value={user.telegramId ? String(user.telegramId) : '-'} />
              <DetailRow
                label={ts('admin.users.status')}
                value={
                  user.isBlocked ? (
                    <Badge variant="destructive">{ts('admin.users.blocked')}</Badge>
                  ) : (
                    <Badge variant="secondary">{ts('admin.active')}</Badge>
                  )
                }
              />
              <DetailRow
                label={ts('admin.users.lastActive')}
                value={
                  user.lastActiveAt
                    ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                    : '-'
                }
              />
              <DetailRow
                label={ts('admin.users.registeredAt')}
                value={format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm')}
              />
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          {/* Premium Management Card */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {ts('admin.userDetail.premiumManagement')}
            </h3>
            <div>
              {user.activeSubscription ? (
                <div className="space-y-4">
                  <dl className="space-y-3 text-sm">
                    <DetailRow label={ts('admin.userDetail.plan')} value={user.activeSubscription.planName} />
                    <DetailRow
                      label={ts('admin.users.status')}
                      value={<Badge variant="default">{ts('admin.userDetail.premiumActive')}</Badge>}
                    />
                    {user.isManualPremium && (
                      <DetailRow
                        label={ts('admin.userDetail.source')}
                        value={<Badge variant="outline">{ts('admin.userDetail.manuallyGranted')}</Badge>}
                      />
                    )}
                    <DetailRow
                      label={ts('admin.userDetail.expiresAt')}
                      value={
                        isForeverDate(user.activeSubscription.expiresAt)
                          ? <span className="flex items-center gap-1">{ts('admin.userDetail.forever')} <span className="text-lg">&#8734;</span></span>
                          : format(new Date(user.activeSubscription.expiresAt), 'dd.MM.yyyy HH:mm')
                      }
                    />
                  </dl>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={openGrantDialog}>
                      <Clock className="mr-1.5 h-4 w-4" />
                      {ts('admin.userDetail.extendPremium')}
                    </Button>
                    <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setConfirmAction('revoke')}>
                      <XCircle className="mr-1.5 h-4 w-4" />
                      {ts('admin.userDetail.revokePremium')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge variant="secondary">{ts('admin.userDetail.noPremium')}</Badge>
                  <div>
                    <Button size="sm" className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openGrantDialog}>
                      <Crown className="mr-1.5 h-4 w-4" />
                      {ts('admin.userDetail.grantPremium')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold mb-4">{ts('admin.userDetail.statistics')}</h3>
            <dl className="space-y-3 text-sm">
              <DetailRow label={ts('admin.userDetail.totalExams')} value={String(user.totalExams)} />
              <DetailRow label={ts('admin.userDetail.completedExams')} value={String(user.completedExams)} />
              <DetailRow
                label={ts('admin.userDetail.averageScore')}
                value={`${Math.round(user.averageScore)}%`}
              />
            </dl>
          </div>
        </div>
      </div>

      {/* Subscription History */}
      {user.subscriptionHistory.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold mb-4">{ts('admin.userDetail.subscriptionHistory')}</h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>{ts('admin.userDetail.planName')}</TableHead>
                  <TableHead>{ts('admin.userDetail.startDate')}</TableHead>
                  <TableHead>{ts('admin.userDetail.endDate')}</TableHead>
                  <TableHead>{ts('admin.users.status')}</TableHead>
                  <TableHead>{ts('admin.userDetail.source')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.subscriptionHistory.map((sub, idx) => (
                  <TableRow key={idx} className="hover:bg-white/30 transition-colors">
                    <TableCell className="font-medium">{sub.planName}</TableCell>
                    <TableCell>{format(new Date(sub.startsAt), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>
                      {isForeverDate(sub.expiresAt)
                        ? ts('admin.userDetail.forever')
                        : format(new Date(sub.expiresAt), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>{getProviderLabel(sub.provider)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      )}

      {/* Grant Premium Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {user.activeSubscription
                ? ts('admin.userDetail.extendPremium')
                : ts('admin.userDetail.grantPremium')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{ts('admin.userDetail.selectPlan')}</Label>
              <Select value={selectedPlanId} onValueChange={(v) => setSelectedPlanId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder={ts('admin.userDetail.selectPlan')} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{ts('admin.userDetail.duration')}</Label>
              <RadioGroup value={durationOption} onValueChange={(v) => setDurationOption(v as DurationOption)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="d30" />
                  <Label htmlFor="d30">{ts('admin.userDetail.days30')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="90" id="d90" />
                  <Label htmlFor="d90">{ts('admin.userDetail.days90')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="365" id="d365" />
                  <Label htmlFor="d365">{ts('admin.userDetail.days365')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="forever" id="dforever" />
                  <Label htmlFor="dforever">{ts('admin.userDetail.forever')} &#8734;</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="dcustom" />
                  <Label htmlFor="dcustom">{ts('admin.userDetail.customDays')}</Label>
                </div>
              </RadioGroup>
              {durationOption === 'custom' && (
                <Input
                  type="number"
                  min={1}
                  placeholder={ts('admin.userDetail.customDays')}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{ts('admin.userDetail.grantNote')}</Label>
              <Textarea
                placeholder={ts('admin.userDetail.grantNote')}
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleGrantPremium} disabled={grantLoading || !selectedPlanId} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {grantLoading ? ts('admin.saving') : ts('admin.userDetail.grantConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog
        open={confirmAction === 'role'}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setPendingRole(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.userDetail.changeRoleTitle')}</DialogTitle>
            <DialogDescription>
              {fullName} — {pendingRole === 'admin' ? ts('admin.users.admin') : ts('admin.users.user')}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmAction(null); setPendingRole(null); }}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {actionLoading ? ts('admin.saving') : ts('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Dialog */}
      <Dialog
        open={confirmAction === 'block'}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{user.isBlocked ? ts('admin.userDetail.unblock') : ts('admin.userDetail.block')}</DialogTitle>
            <DialogDescription>
              {fullName} {user.isBlocked ? ts('admin.userDetail.unblockConfirmMsg') : ts('admin.userDetail.blockConfirmMsg')}
              {!user.isBlocked && ` ${ts('admin.userDetail.blockWarning')}`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              {ts('common.cancel')}
            </Button>
            <Button
              variant={user.isBlocked ? 'default' : 'destructive'}
              onClick={handleBlockToggle}
              disabled={actionLoading}
            >
              {actionLoading ? ts('admin.saving') : ts('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Premium Dialog */}
      <Dialog
        open={confirmAction === 'revoke'}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.userDetail.revokeConfirm')}</DialogTitle>
            <DialogDescription>{ts('admin.userDetail.revokeWarning')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRevokePremium} disabled={actionLoading}>
              {actionLoading ? ts('admin.saving') : ts('admin.userDetail.revokePremium')}
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
