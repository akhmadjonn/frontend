'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { SystemSettingDto } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Save, Settings, CreditCard, MessageSquare, GraduationCap, Shield,
  Wrench, Loader2, Clock, Hash, Gauge, Smartphone, ToggleRight, Globe,
} from 'lucide-react';

// --- Map each snake_case key to a semantic group ---
const KEY_GROUP_MAP: Record<string, string> = {
  free_daily_exam_limit: 'exam',
  max_active_sessions: 'exam',
  max_exams_per_day: 'exam',
  otp_ttl_minutes: 'auth',
  otp_rate_limit_count: 'auth',
  otp_rate_limit_window_minutes: 'auth',
  otp_cooldown_seconds: 'auth',
  otp_expiry_seconds: 'auth',
  otp_max_attempts: 'auth',
  payme_enabled: 'payment',
  click_enabled: 'payment',
  sms_provider: 'sms',
  maintenance_mode: 'system',
  min_app_version: 'system',
  presigned_url_hours: 'system',
};

// --- Human-readable labels and icons per setting key ---
const KEY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  free_daily_exam_limit: { label: 'Kunlik bepul imtihon limiti', icon: <Hash className="h-3.5 w-3.5" /> },
  max_active_sessions: { label: 'Maksimal faol seanslar', icon: <Gauge className="h-3.5 w-3.5" /> },
  max_exams_per_day: { label: "Kuniga maksimal imtihonlar", icon: <Hash className="h-3.5 w-3.5" /> },
  otp_ttl_minutes: { label: 'OTP amal qilish vaqti (daqiqa)', icon: <Clock className="h-3.5 w-3.5" /> },
  otp_rate_limit_count: { label: "OTP so'rovlar limiti", icon: <Hash className="h-3.5 w-3.5" /> },
  otp_rate_limit_window_minutes: { label: 'OTP limit oynasi (daqiqa)', icon: <Clock className="h-3.5 w-3.5" /> },
  otp_cooldown_seconds: { label: "OTP kutish vaqti (soniya)", icon: <Clock className="h-3.5 w-3.5" /> },
  otp_expiry_seconds: { label: "OTP tugash vaqti (soniya)", icon: <Clock className="h-3.5 w-3.5" /> },
  otp_max_attempts: { label: 'OTP maksimal urinishlar', icon: <Hash className="h-3.5 w-3.5" /> },
  payme_enabled: { label: 'Payme yoqilgan', icon: <ToggleRight className="h-3.5 w-3.5" /> },
  click_enabled: { label: 'Click yoqilgan', icon: <ToggleRight className="h-3.5 w-3.5" /> },
  sms_provider: { label: 'SMS provayder', icon: <Smartphone className="h-3.5 w-3.5" /> },
  maintenance_mode: { label: "Texnik xizmat rejimi", icon: <Wrench className="h-3.5 w-3.5" /> },
  min_app_version: { label: 'Minimal ilova versiyasi', icon: <Globe className="h-3.5 w-3.5" /> },
  presigned_url_hours: { label: "URL amal qilish muddati (soat)", icon: <Clock className="h-3.5 w-3.5" /> },
};

const BOOLEAN_KEYS = new Set(['maintenance_mode', 'payme_enabled', 'click_enabled']);

interface GroupConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  order: number;
}

const GROUP_CONFIG: Record<string, GroupConfig> = {
  exam: {
    title: 'Imtihon sozlamalari',
    description: "Savollar soni, limitlar va sessiya boshqaruvi",
    icon: <GraduationCap className="h-5 w-5" />,
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    order: 1,
  },
  auth: {
    title: 'Autentifikatsiya',
    description: 'OTP vaqtlari, limitlar va urinishlar',
    icon: <Shield className="h-5 w-5" />,
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    order: 2,
  },
  payment: {
    title: "To'lov provayderlari",
    description: "Payme va Click yoqish/o'chirish",
    icon: <CreditCard className="h-5 w-5" />,
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    order: 3,
  },
  sms: {
    title: 'SMS xabarlar',
    description: 'SMS provayder sozlamalari',
    icon: <MessageSquare className="h-5 w-5" />,
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    order: 4,
  },
  system: {
    title: 'Tizim',
    description: "Texnik xizmat rejimi va umumiy sozlamalar",
    icon: <Wrench className="h-5 w-5" />,
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    order: 5,
  },
};

interface SettingGroup {
  groupKey: string;
  config: GroupConfig;
  settings: SystemSettingDto[];
}

function groupSettings(settings: SystemSettingDto[]): SettingGroup[] {
  const groups: Record<string, SystemSettingDto[]> = {};

  for (const setting of settings) {
    const groupKey = KEY_GROUP_MAP[setting.key] ?? 'system';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(setting);
  }

  return Object.entries(groups)
    .map(([groupKey, items]) => {
      const config = GROUP_CONFIG[groupKey] ?? {
        title: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
        description: `${groupKey} sozlamalari`,
        icon: <Settings className="h-5 w-5" />,
        iconBg: 'bg-muted text-muted-foreground',
        order: 99,
      };
      return { groupKey, config, settings: items };
    })
    .sort((a, b) => a.config.order - b.config.order);
}

function getLabel(key: string): string {
  return KEY_LABELS[key]?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getIcon(key: string): React.ReactNode {
  return KEY_LABELS[key]?.icon ?? <Settings className="h-3.5 w-3.5" />;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savingGroups, setSavingGroups] = useState<Set<string>>(new Set());

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<SystemSettingDto[]>('/admin/settings');
      setSettings(data);
      setEditedValues({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sozlamalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getCurrentValue = (key: string): string => {
    if (key in editedValues) return editedValues[key];
    const setting = settings.find((s) => s.key === key);
    return setting?.value ?? '';
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const isModified = (key: string): boolean => {
    if (!(key in editedValues)) return false;
    const original = settings.find((s) => s.key === key);
    return editedValues[key] !== (original?.value ?? '');
  };

  const saveSetting = async (key: string) => {
    const value = getCurrentValue(key);
    setSavingKeys((prev) => new Set([...prev, key]));
    try {
      await apiClient.put('/admin/settings', { key, value });
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
      setEditedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success(`"${getLabel(key)}" saqlandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `"${key}" saqlashda xatolik`);
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const saveGroup = async (group: SettingGroup) => {
    const modifiedSettings = group.settings.filter((s) => isModified(s.key));
    if (modifiedSettings.length === 0) {
      toast.info('Hech narsa o\'zgartirilmagan');
      return;
    }

    setSavingGroups((prev) => new Set([...prev, group.groupKey]));
    try {
      for (const setting of modifiedSettings) {
        const value = getCurrentValue(setting.key);
        await apiClient.put('/admin/settings', { key: setting.key, value });
        setSettings((prev) =>
          prev.map((s) => (s.key === setting.key ? { ...s, value } : s))
        );
        setEditedValues((prev) => {
          const next = { ...prev };
          delete next[setting.key];
          return next;
        });
      }
      toast.success(`${group.config.title} saqlandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Saqlashda xatolik');
    } finally {
      setSavingGroups((prev) => {
        const next = new Set(prev);
        next.delete(group.groupKey);
        return next;
      });
    }
  };

  const hasGroupModifications = (group: SettingGroup) =>
    group.settings.some((s) => isModified(s.key));

  const totalModified = Object.keys(editedValues).filter((k) => isModified(k)).length;
  const groups = groupSettings(settings);

  if (loading)
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-56" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-14 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tizim sozlamalari</h1>
          <p className="text-sm text-muted-foreground">
            Platformaning barcha sozlamalarini boshqarish
          </p>
        </div>
        {totalModified > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {totalModified} o&#39;zgarish saqlanmagan
          </div>
        )}
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
          const groupModCount = group.settings.filter((s) => isModified(s.key)).length;
          return (
            <Card key={group.groupKey}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${group.config.iconBg}`}>
                      {group.config.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{group.config.title}</CardTitle>
                        {groupModCount > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            {groupModCount}
                          </span>
                        )}
                      </div>
                      <CardDescription>{group.config.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!hasGroupModifications(group) || savingGroups.has(group.groupKey)}
                    onClick={() => saveGroup(group)}
                    className="gap-1.5"
                  >
                    {savingGroups.has(group.groupKey)
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Save className="h-4 w-4" />
                    }
                    {savingGroups.has(group.groupKey) ? 'Saqlanmoqda...' : 'Saqlash'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.settings.map((setting) => {
                    const currentValue = getCurrentValue(setting.key);
                    const modified = isModified(setting.key);
                    const isSaving = savingKeys.has(setting.key);
                    const isBool = BOOLEAN_KEYS.has(setting.key);

                    return (
                      <div
                        key={setting.key}
                        className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                          modified
                            ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <div className="mt-0.5 text-muted-foreground">
                            {getIcon(setting.key)}
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">{getLabel(setting.key)}</Label>
                            {setting.description && (
                              <p className="text-xs text-muted-foreground">{setting.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBool ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={currentValue === 'true'}
                                onCheckedChange={(checked) =>
                                  handleValueChange(setting.key, String(checked))
                                }
                              />
                              <span className={`text-xs font-medium min-w-16 ${
                                currentValue === 'true'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-muted-foreground'
                              }`}>
                                {currentValue === 'true' ? 'Yoqilgan' : "O'chirilgan"}
                              </span>
                            </div>
                          ) : (
                            <Input
                              value={currentValue}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              className="w-full sm:w-48"
                            />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!modified || isSaving}
                            onClick={() => saveSetting(setting.key)}
                            className="shrink-0"
                          >
                            {isSaving
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Save className="h-3.5 w-3.5" />
                            }
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <Settings className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Sozlamalar topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">Hech qanday tizim sozlamasi mavjud emas</p>
        </div>
      )}
    </div>
  );
}
