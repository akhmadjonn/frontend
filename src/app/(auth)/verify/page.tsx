'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import OtpInput from '@/components/auth/otp-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/hooks/use-locale';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';
import { OTP_RESEND_SECONDS } from '@/lib/constants';

export default function VerifyPage() {
  const router = useRouter();
  const { ts } = useLocale();
  const login = useAuthStore((s) => s.login);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(OTP_RESEND_SECONDS);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [error, setError] = useState('');
  const [phone] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('otp_phone') ?? '' : '');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (!phone && !verified) router.replace('/login');
  }, [phone, verified, router]);

  const handleVerify = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const tokens = await apiClient.post<{ accessToken: string; refreshToken: string; isNewUser: boolean }>('/auth/otp/verify', { phoneNumber: phone, code });
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      apiClient.updateToken(tokens.accessToken);
      const user = await apiClient.get<{ id: string; phoneNumber: string | null; firstName: string | null; lastName: string | null; role: 'user' | 'admin'; hasActiveSubscription: boolean; preferredLanguage: 'uz' | 'uzLatin' | 'ru' }>('/auth/me');
      login(tokens.accessToken, tokens.refreshToken, user);
      setVerified(true);
      sessionStorage.removeItem('otp_phone');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ts('common.error');
      setError(message);
      setOtp('');
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      if (newAttempts <= 0) {
        toast.error(ts('auth.attemptsExhausted'));
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [phone, login, router, attemptsLeft, ts]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await apiClient.post('/auth/otp/send', { phoneNumber: phone });
      setResendCooldown(OTP_RESEND_SECONDS);
      setAttemptsLeft(3);
      setOtp('');
      setError('');
      toast.success(ts('auth.newCodeSent'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    }
  };

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '').replace(/^998/, '');
    return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {ts('common.back')}
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{ts('auth.otpTitle')}</CardTitle>
            <CardDescription>{formatPhone(phone)} {ts('auth.otpSentTo')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); if (!loading && otp.length === 6) handleVerify(otp); }} className="space-y-6">
              <OtpInput value={otp} onChange={setOtp} onComplete={handleVerify} disabled={loading || attemptsLeft === 0} error={error} />

              {error && <p className="text-center text-sm text-destructive">{error}</p>}
              {attemptsLeft < 3 && attemptsLeft > 0 && <p className="text-center text-sm text-amber-600">{attemptsLeft} {ts('auth.attemptsLeft')}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading || otp.length !== 6}>
                {loading ? ts('auth.verifying') : ts('auth.verify')}
              </Button>
            </form>

            <div className="text-center">
              {resendCooldown > 0
                ? <p className="text-sm text-muted-foreground">{ts('auth.resendIn')} {resendCooldown}s</p>
                : <button onClick={handleResend} className="text-sm text-primary hover:underline">{ts('auth.resend')}</button>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
