'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/stores/locale-store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Languages, Shield, LogOut, Loader2, Save, Phone, Crown, CheckCircle2, XCircle } from 'lucide-react';

const languageOptions: { value: Locale; label: string; flag: string; backendValue: string }[] = [
  { value: 'uzLatin', label: "O'zbek (Lotin)", flag: '🇺🇿', backendValue: 'UzLatin' },
  { value: 'uz', label: "O'zbek (Kirill)", flag: '🇺🇿', backendValue: 'Uz' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺', backendValue: 'Ru' },
];

function mapBackendLanguage(lang: string): Locale {
  switch (lang) {
    case 'uz': return 'uz';
    case 'uzLatin': return 'uzLatin';
    case 'ru': return 'ru';
    default: return 'uzLatin';
  }
}

function mapLocaleToBackend(locale: Locale): string {
  switch (locale) {
    case 'uz': return 'Uz';
    case 'uzLatin': return 'UzLatin';
    case 'ru': return 'Ru';
  }
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const { language, setLanguage } = useLocaleStore();
  const { ts } = useLocale();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedLang, setSelectedLang] = useState<Locale>(language);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLang, setSavingLang] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setSelectedLang(mapBackendLanguage(user.preferredLanguage));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const result = await apiClient.patch<{
        id: string;
        phoneNumber: string | null;
        firstName: string | null;
        lastName: string | null;
        role: 'user' | 'admin';
        preferredLanguage: 'uz' | 'uzLatin' | 'ru';
        hasActiveSubscription: boolean;
      }>('/auth/profile', { firstName: firstName || null, lastName: lastName || null });

      setUser({
        id: result.id,
        phoneNumber: result.phoneNumber,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        preferredLanguage: result.preferredLanguage,
        hasActiveSubscription: result.hasActiveSubscription,
      });

      toast.success(ts('settings.profileUpdated'));
    } catch (err: any) {
      toast.error(err?.message || ts('common.error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveLanguage = async () => {
    setSavingLang(true);
    try {
      const backendLang = mapLocaleToBackend(selectedLang);
      const result = await apiClient.patch<{
        id: string;
        phoneNumber: string | null;
        firstName: string | null;
        lastName: string | null;
        role: 'user' | 'admin';
        preferredLanguage: 'uz' | 'uzLatin' | 'ru';
        hasActiveSubscription: boolean;
      }>('/auth/profile', { preferredLanguage: backendLang });

      setUser({
        id: result.id,
        phoneNumber: result.phoneNumber,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        preferredLanguage: result.preferredLanguage,
        hasActiveSubscription: result.hasActiveSubscription,
      });

      setLanguage(selectedLang);
      toast.success(ts('settings.languageUpdated'));
    } catch (err: any) {
      toast.error(err?.message || ts('common.error'));
    } finally {
      setSavingLang(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken)
        await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // ignore logout API errors
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  const roleLabel = user?.role === 'admin' ? ts('settings.admin') : ts('settings.user');
  const phoneDisplay = user?.phoneNumber
    ? `+${user.phoneNumber.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`
    : ts('settings.notProvided');

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts('settings.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{ts('settings.profile')}</CardTitle>
              <CardDescription>{ts('settings.profileDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-lg font-bold dark:bg-blue-950/40 dark:text-blue-300">
              {initials}
            </div>
            <div>
              <p className="font-medium">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || ts('settings.noName')}</p>
              <p className="text-sm text-muted-foreground">{phoneDisplay}</p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{ts('settings.firstName')}</Label>
              <Input
                id="firstName"
                placeholder={ts('settings.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{ts('settings.lastName')}</Label>
              <Input
                id="lastName"
                placeholder={ts('settings.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {ts('common.save')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{ts('settings.language')}</CardTitle>
              <CardDescription>{ts('settings.languageDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {languageOptions.map((opt) => {
              const isSelected = selectedLang === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedLang(opt.value)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="text-xl">{opt.flag}</span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-green-700 dark:text-green-300' : ''}`}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </button>
              );
            })}
          </div>
          <Button
            onClick={handleSaveLanguage}
            disabled={savingLang || selectedLang === language}
            variant="outline"
            className="gap-2"
          >
            {savingLang ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {ts('settings.saveLanguage')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{ts('settings.accountInfo')}</CardTitle>
              <CardDescription>{ts('settings.accountDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{ts('settings.phoneNumber')}</span>
              </div>
              <span className="text-sm font-medium font-mono">{phoneDisplay}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{ts('settings.role')}</span>
              </div>
              <span className="text-sm font-medium">{roleLabel}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {user?.hasActiveSubscription
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-muted-foreground" />
                }
                <span className="text-sm text-muted-foreground">{ts('settings.subscriptionLabel')}</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                user?.hasActiveSubscription
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-muted-foreground'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  user?.hasActiveSubscription ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                {user?.hasActiveSubscription ? ts('settings.activeStatus') : ts('settings.inactiveStatus')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base text-red-600 dark:text-red-400">{ts('settings.dangerZone')}</CardTitle>
              <CardDescription>{ts('settings.dangerDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {ts('settings.logoutBtn')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
