'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocaleStore } from '@/stores/locale-store';
import type { Locale } from '@/stores/locale-store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { User, Languages, Shield, LogOut, Loader2, Save } from 'lucide-react';

const languageOptions: { value: Locale; label: string; backendValue: string }[] = [
  { value: 'uzLatin', label: "O'zbek (Lotin)", backendValue: 'UzLatin' },
  { value: 'uz', label: "O'zbek (Kirill)", backendValue: 'Uz' },
  { value: 'ru', label: 'Русский', backendValue: 'Ru' },
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

      toast.success('Profil yangilandi');
    } catch (err: any) {
      toast.error(err?.message || 'Xatolik yuz berdi');
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
      toast.success('Til yangilandi');
    } catch (err: any) {
      toast.error(err?.message || 'Xatolik yuz berdi');
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

  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Foydalanuvchi';
  const phoneDisplay = user?.phoneNumber
    ? `+${user.phoneNumber.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`
    : 'Kiritilmagan';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground mt-1">Profilingiz va tilni boshqaring</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profil</CardTitle>
          </div>
          <CardDescription>Ism va familiyangizni yangilang</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ism</Label>
              <Input
                id="firstName"
                placeholder="Ismingiz"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Familiya</Label>
              <Input
                id="lastName"
                placeholder="Familiyangiz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Saqlash
          </Button>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Til</CardTitle>
          </div>
          <CardDescription>Interfeys va savollar tilini tanlang</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedLang}
            onValueChange={(val) => setSelectedLang(val as Locale)}
            className="space-y-3"
          >
            {languageOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3">
                <RadioGroupItem value={opt.value} id={`lang-${opt.value}`} />
                <Label htmlFor={`lang-${opt.value}`} className="cursor-pointer font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <Button
            onClick={handleSaveLanguage}
            disabled={savingLang || selectedLang === language}
            variant="outline"
            className="gap-2"
          >
            {savingLang ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Tilni saqlash
          </Button>
        </CardContent>
      </Card>

      {/* Account Info Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Hisob ma'lumotlari</CardTitle>
          </div>
          <CardDescription>Hisobingiz haqida umumiy ma'lumot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Telefon raqam</span>
              <span className="text-sm font-medium">{phoneDisplay}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rol</span>
              <span className="text-sm font-medium">{roleLabel}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Obuna</span>
              <span className="text-sm font-medium">
                {user?.hasActiveSubscription ? 'Faol' : 'Faol emas'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Xavfli zona</CardTitle>
          </div>
          <CardDescription>Hisobdan chiqish barcha qurilmalardagi seansni tugatadi</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Hisobdan chiqish
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
