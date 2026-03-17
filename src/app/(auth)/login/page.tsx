'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PhoneInput from '@/components/auth/phone-input';
import TelegramLoginButton from '@/components/auth/telegram-login-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocaleStore, useLocaleHydration } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { phoneSchema } from '@/lib/validators';
import { Car } from 'lucide-react';

const LANG_OPTIONS = [
  { key: 'uzLatin' as const, label: 'UZ Lotin' },
  { key: 'uz' as const, label: 'UZ Kirill' },
  { key: 'ru' as const, label: 'Рус' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  useLocaleHydration();
  const { language, setLanguage } = useLocaleStore();
  const { ts } = useLocale();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('998');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? 'avtolider_test_bot';

  const handleSendOtp = async () => {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) { setPhoneError(result.error.issues[0].message); return; }
    setPhoneError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/otp/send', { phoneNumber: phone });
      sessionStorage.setItem('otp_phone', phone);
      router.push('/verify');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (user: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string }) => {
    try {
      const tokens = await apiClient.post<{ accessToken: string; refreshToken: string; isNewUser: boolean }>('/auth/telegram', {
        id: user.id, firstName: user.first_name, lastName: user.last_name ?? null, username: user.username ?? null, photoUrl: user.photo_url ?? null, authDate: user.auth_date, hash: user.hash,
      });
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      apiClient.updateToken(tokens.accessToken);
      const profile = await apiClient.get<{ id: string; phoneNumber: string | null; firstName: string | null; lastName: string | null; role: 'user' | 'admin'; hasActiveSubscription: boolean; preferredLanguage: 'uz' | 'uzLatin' | 'ru' }>('/auth/me');
      login(tokens.accessToken, tokens.refreshToken, profile);
      sessionStorage.removeItem('otp_phone');
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="absolute top-4 right-4 flex rounded-lg border overflow-hidden">
        {LANG_OPTIONS.map((opt) => (
          <button key={opt.key} onClick={() => setLanguage(opt.key)} className={`px-2.5 py-1 text-xs font-medium transition-colors ${language === opt.key ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
            <Car className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{ts('header.appName')}</h1>
          <p className="text-sm text-muted-foreground text-center">{ts('auth.subtitle')}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{ts('auth.phoneNumber')}</CardTitle>
            <CardDescription>{ts('auth.smsWillBeSent')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); if (!loading && phone.length >= 12) handleSendOtp(); }} className="space-y-4">
              <div className="space-y-1">
                <PhoneInput value={phone} onChange={setPhone} disabled={loading} error={phoneError} />
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading || phone.length < 12}>
                {loading ? ts('auth.sending') : ts('auth.sendOtp')}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{ts('auth.or')}</span>
              </div>
            </div>

            <TelegramLoginButton botName={botName} onAuth={handleTelegramAuth} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
