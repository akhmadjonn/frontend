'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLocaleStore, useLocaleHydration } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Settings } from 'lucide-react';

const LANG_OPTIONS = [
  { key: 'uzLatin' as const, label: 'UZ' },
  { key: 'uz' as const, label: 'КИ' },
  { key: 'ru' as const, label: 'РУ' },
] as const;

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  useLocaleHydration();
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);
  const { ts } = useLocale();

  const handleLogout = async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    router.replace('/login');
  };

  const initials = user?.firstName
    ? (user.firstName[0] + (user.lastName?.[0] ?? '')).toUpperCase()
    : (user?.phoneNumber?.slice(-2) ?? 'U');

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-bold text-lg">{ts('header.appName')}</span>
      </div>
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border overflow-hidden">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setLanguage(opt.key)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${language === opt.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.firstName ?? ts('header.defaultUser')}</p>
              <p className="text-xs text-muted-foreground">{user?.phoneNumber ?? ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> {ts('header.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" /> {ts('header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
