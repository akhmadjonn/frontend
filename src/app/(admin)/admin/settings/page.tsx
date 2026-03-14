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
import { Save, Settings, CreditCard, MessageSquare, GraduationCap, Shield, Wrench } from 'lucide-react';

interface SettingGroup {
  prefix: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: SystemSettingDto[];
}

const GROUP_CONFIG: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  payment: {
    title: "To'lov provayderlari",
    description: "Payme va Click sozlamalari",
    icon: <CreditCard className="h-5 w-5" />,
  },
  sms: {
    title: 'SMS xabarlar',
    description: 'Eskiz.uz va SMS sozlamalari',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  exam: {
    title: 'Imtihon sozlamalari',
    description: "Imtihon vaqti, savollar soni va o'tish bali",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  auth: {
    title: 'Autentifikatsiya',
    description: 'OTP, JWT va sessiya sozlamalari',
    icon: <Shield className="h-5 w-5" />,
  },
  system: {
    title: 'Tizim',
    description: "Umumiy tizim sozlamalari va texnik xizmat ko'rsatish rejimi",
    icon: <Wrench className="h-5 w-5" />,
  },
};

function groupSettings(settings: SystemSettingDto[]): SettingGroup[] {
  const groups: Record<string, SystemSettingDto[]> = {};

  for (const setting of settings) {
    const prefix = setting.key.split('.')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(setting);
  }

  return Object.entries(groups).map(([prefix, items]) => {
    const config = GROUP_CONFIG[prefix] ?? {
      title: prefix.charAt(0).toUpperCase() + prefix.slice(1),
      description: `${prefix} sozlamalari`,
      icon: <Settings className="h-5 w-5" />,
    };

    return {
      prefix,
      title: config.title,
      description: config.description,
      icon: config.icon,
      settings: items.sort((a, b) => a.key.localeCompare(b.key)),
    };
  });
}

function getSettingLabel(key: string): string {
  const parts = key.split('.');
  return parts.slice(1).join(' ').replace(/([A-Z])/g, ' $1').trim();
}

function isBooleanSetting(key: string): boolean {
  return key === 'system.maintenanceMode';
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
      toast.success(`"${key}" saqlandi`);
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

    setSavingGroups((prev) => new Set([...prev, group.prefix]));
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
      toast.success(`${group.title} sozlamalari saqlandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Saqlashda xatolik');
    } finally {
      setSavingGroups((prev) => {
        const next = new Set(prev);
        next.delete(group.prefix);
        return next;
      });
    }
  };

  const hasGroupModifications = (group: SettingGroup) =>
    group.settings.some((s) => isModified(s.key));

  const groups = groupSettings(settings);

  if (loading)
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tizim sozlamalari</h1>
        <p className="text-sm text-muted-foreground">
          Platformaning barcha sozlamalarini boshqarish
        </p>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <Card key={group.prefix}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {group.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{group.title}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!hasGroupModifications(group) || savingGroups.has(group.prefix)}
                  onClick={() => saveGroup(group)}
                >
                  <Save className="h-4 w-4" />
                  {savingGroups.has(group.prefix) ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.settings.map((setting) => {
                  const currentValue = getCurrentValue(setting.key);
                  const modified = isModified(setting.key);
                  const isSaving = savingKeys.has(setting.key);
                  const isBool = isBooleanSetting(setting.key);

                  return (
                    <div
                      key={setting.key}
                      className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                        modified ? 'border-primary/40 bg-primary/5' : ''
                      }`}
                    >
                      <div className="space-y-0.5 flex-1">
                        <Label className="text-sm font-medium">{getSettingLabel(setting.key)}</Label>
                        <p className="text-xs text-muted-foreground font-mono">{setting.key}</p>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground">{setting.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isBool ? (
                          <Switch
                            checked={currentValue === 'true'}
                            onCheckedChange={(checked) =>
                              handleValueChange(setting.key, String(checked))
                            }
                          />
                        ) : (
                          <Input
                            value={currentValue}
                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                            className="w-full sm:w-64"
                          />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!modified || isSaving}
                          onClick={() => saveSetting(setting.key)}
                        >
                          {isSaving ? '...' : <Save className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="rounded-md border py-12 text-center">
          <Settings className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Sozlamalar topilmadi</p>
        </div>
      )}
    </div>
  );
}
