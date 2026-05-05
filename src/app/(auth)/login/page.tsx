'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PhoneInput from '@/components/auth/phone-input';
// TODO: Telegram login will be used in future — uncomment when bot is configured
// import TelegramLoginButton from '@/components/auth/telegram-login-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/hooks/use-locale';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { phoneSchema } from '@/lib/validators';
import LanguageSwitcher from '@/components/layout/language-switcher';

export default function LoginPage() {
  const router = useRouter();
  const { ts } = useLocale();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('998');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // TODO: Telegram login will be used in future — uncomment when bot is configured
  // const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? 'avtolider_test_bot';

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

  // TODO: Telegram login will be used in future — uncomment when bot is configured
  // const handleTelegramAuth = async (user: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string }) => {
  //   try {
  //     const tokens = await apiClient.post<{ accessToken: string; refreshToken: string; isNewUser: boolean }>('/auth/telegram', {
  //       id: user.id, firstName: user.first_name, lastName: user.last_name ?? null, username: user.username ?? null, photoUrl: user.photo_url ?? null, authDate: user.auth_date, hash: user.hash,
  //     });
  //     localStorage.setItem('avtolider:accessToken', tokens.accessToken);
  //     localStorage.setItem('avtolider:refreshToken', tokens.refreshToken);
  //     apiClient.updateToken(tokens.accessToken);
  //     const profile = await apiClient.get<{ id: string; phoneNumber: string | null; firstName: string | null; lastName: string | null; role: 'user' | 'admin'; hasActiveSubscription: boolean; preferredLanguage: 'uz' | 'uzLatin' | 'ru' }>('/auth/me');
  //     login(tokens.accessToken, tokens.refreshToken, profile);
  //     sessionStorage.removeItem('otp_phone');
  //     router.replace('/dashboard');
  //   } catch (err: unknown) {
  //     toast.error(err instanceof Error ? err.message : ts('common.error'));
  //   }
  // };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-auth-gradient px-4 py-12 relative">
      {/* Language toggle — top right */}
      <div className="absolute top-5 right-5">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-8 animate-fade-up">
        {/* Logo + branding */}
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-full.svg" alt="Avtolider" className="h-20 w-auto" />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">{ts('header.appName')}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{ts('auth.subtitle')}</p>
          </div>
        </div>

        {/* Login card */}
        <Card className="shadow-xl shadow-black/[0.04] rounded-2xl border-border/40">
          <CardHeader className="pb-3 pt-6 px-6">
            <CardTitle className="text-base font-semibold">{ts('auth.phoneNumber')}</CardTitle>
            <CardDescription className="text-sm">{ts('auth.smsWillBeSent')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <form onSubmit={(e) => { e.preventDefault(); if (!loading && phone.length >= 12) handleSendOtp(); }} className="space-y-4">
              <div className="space-y-1.5">
                <PhoneInput value={phone} onChange={setPhone} disabled={loading} error={phoneError} />
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>

              <Button type="submit" className="w-full rounded-xl h-11 bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white font-semibold" size="lg" disabled={loading || phone.length < 12}>
                {loading ? ts('auth.sending') : ts('auth.sendOtp')}
              </Button>
            </form>

            {/* TODO: Telegram login will be used in future — uncomment when bot is configured */}
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">{ts('auth.or')}</span>
              </div>
            </div>

            <TelegramLoginButton botName={botName} onAuth={handleTelegramAuth} /> */}
          </CardContent>
        </Card>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-8 rounded-full bg-[oklch(0.588_0.158_241)]" />
          <div className="h-2 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
