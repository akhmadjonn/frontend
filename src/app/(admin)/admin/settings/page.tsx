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
import { useLocale } from '@/hooks/use-locale';

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

// --- Icons per setting key (no translation needed) ---
const KEY_ICONS: Record<string, React.ReactNode> = {
  free_daily_exam_limit: <Hash className="h-3.5 w-3.5" />,
  max_active_sessions: <Gauge className="h-3.5 w-3.5" />,
  max_exams_per_day: <Hash className="h-3.5 w-3.5" />,
  otp_ttl_minutes: <Clock className="h-3.5 w-3.5" />,
  otp_rate_limit_count: <Hash className="h-3.5 w-3.5" />,
  otp_rate_limit_window_minutes: <Clock className="h-3.5 w-3.5" />,
  otp_cooldown_seconds: <Clock className="h-3.5 w-3.5" />,
  otp_expiry_seconds: <Clock className="h-3.5 w-3.5" />,
  otp_max_attempts: <Hash className="h-3.5 w-3.5" />,
  payme_enabled: <ToggleRight className="h-3.5 w-3.5" />,
  click_enabled: <ToggleRight className="h-3.5 w-3.5" />,
  sms_provider: <Smartphone className="h-3.5 w-3.5" />,
  maintenance_mode: <Wrench className="h-3.5 w-3.5" />,
  min_app_version: <Globe className="h-3.5 w-3.5" />,
  presigned_url_hours: <Clock className="h-3.5 w-3.5" />,
};

const BOOLEAN_KEYS = new Set(['maintenance_mode', 'payme_enabled', 'click_enabled']);

interface GroupConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  order: number;
}

// GROUP_CONFIG is built dynamically inside the component to support localization

interface SettingGroup {
  groupKey: string;
  config: GroupConfig;
  settings: SystemSettingDto[];
}

function groupSettings(settings: SystemSettingDto[], groupConfig: Record<string, GroupConfig>): SettingGroup[] {
  const groups: Record<string, SystemSettingDto[]> = {};

  for (const setting of settings) {
    const groupKey = KEY_GROUP_MAP[setting.key] ?? 'system';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(setting);
  }

  return Object.entries(groups)
    .map(([groupKey, items]) => {
      const config = groupConfig[groupKey] ?? {
        title: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
        description: `${groupKey}`,
        icon: <Settings className="h-5 w-5" />,
        iconBg: 'bg-muted text-muted-foreground',
        order: 99,
      };
      return { groupKey, config, settings: items };
    })
    .sort((a, b) => a.config.order - b.config.order);
}

function getIcon(key: string): React.ReactNode {
  return KEY_ICONS[key] ?? <Settings className="h-3.5 w-3.5" />;
}

export default function SystemSettingsPage() {
  const { ts } = useLocale();
  const [settings, setSettings] = useState<SystemSettingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savingGroups, setSavingGroups] = useState<Set<string>>(new Set());

  const getKeyLabel = (key: string): string => {
    const labels: Record<string, string> = {
      free_daily_exam_limit: ts('admin.systemSettings.freeDailyExamLimit'),
      max_active_sessions: ts('admin.systemSettings.maxActiveSessions'),
      max_exams_per_day: ts('admin.systemSettings.maxExamsPerDay'),
      otp_ttl_minutes: ts('admin.systemSettings.otpTtlMinutes'),
      otp_rate_limit_count: ts('admin.systemSettings.otpRateLimitCount'),
      otp_rate_limit_window_minutes: ts('admin.systemSettings.otpRateLimitWindow'),
      otp_cooldown_seconds: ts('admin.systemSettings.otpCooldownSeconds'),
      otp_expiry_seconds: ts('admin.systemSettings.otpExpirySeconds'),
      otp_max_attempts: ts('admin.systemSettings.otpMaxAttempts'),
      payme_enabled: ts('admin.systemSettings.paymeEnabled'),
      click_enabled: ts('admin.systemSettings.clickEnabled'),
      sms_provider: ts('admin.systemSettings.smsProvider'),
      maintenance_mode: ts('admin.systemSettings.maintenanceMode'),
      min_app_version: ts('admin.systemSettings.minAppVersion'),
      presigned_url_hours: ts('admin.systemSettings.presignedUrlHours'),
    };
    return labels[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const groupConfig: Record<string, GroupConfig> = {
    exam: {
      title: ts('admin.systemSettings.examSettings'),
      description: ts('admin.systemSettings.examSettingsDesc'),
      icon: <GraduationCap className="h-5 w-5" />,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      order: 1,
    },
    auth: {
      title: ts('admin.systemSettings.authSettings'),
      description: ts('admin.systemSettings.authSettingsDesc'),
      icon: <Shield className="h-5 w-5" />,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      order: 2,
    },
    payment: {
      title: ts('admin.systemSettings.paymentSettings'),
      description: ts('admin.systemSettings.paymentSettingsDesc'),
      icon: <CreditCard className="h-5 w-5" />,
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      order: 3,
    },
    sms: {
      title: ts('admin.systemSettings.smsSettings'),
      description: ts('admin.systemSettings.smsSettingsDesc'),
      icon: <MessageSquare className="h-5 w-5" />,
      iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      order: 4,
    },
    system: {
      title: ts('admin.systemSettings.systemGroup'),
      description: ts('admin.systemSettings.systemGroupDesc'),
      icon: <Wrench className="h-5 w-5" />,
      iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      order: 5,
    },
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<SystemSettingDto[]>('/admin/settings');
      setSettings(data);
      setEditedValues({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.systemSettings.loadError'));
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
      toast.success(`"${getKeyLabel(key)}" ${ts('admin.systemSettings.saved')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `"${key}" ${ts('admin.systemSettings.saveError')}`);
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
      toast.info(ts('admin.systemSettings.nothingChanged'));
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
      toast.success(`${group.config.title} ${ts('admin.systemSettings.saved')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('admin.systemSettings.saveError'));
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
  const groups = groupSettings(settings, groupConfig);

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
          <h1 className="text-xl font-bold tracking-tight">{ts('admin.systemSettings.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {ts('admin.systemSettings.subtitle')}
          </p>
        </div>
        {totalModified > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {totalModified} {ts('admin.systemSettings.unsavedChanges')}
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
                    {savingGroups.has(group.groupKey) ? ts('admin.saving') : ts('admin.saveBtn')}
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
                            <Label className="text-sm font-medium">{getKeyLabel(setting.key)}</Label>
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
                                {currentValue === 'true' ? ts('admin.systemSettings.enabled') : ts('admin.systemSettings.disabled')}
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
          <p className="text-sm font-medium">{ts('admin.systemSettings.noSettings')}</p>
          <p className="text-xs text-muted-foreground mt-1">{ts('admin.systemSettings.noSettingsDesc')}</p>
        </div>
      )}
    </div>
  );
}
