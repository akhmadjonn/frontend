'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Settings } from 'lucide-react';
import LanguageSwitcher from './language-switcher';

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
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
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between shadow-[0_1px_0_0_var(--border)] bg-background/95 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2.5 md:hidden">
        <img src="/logo-full.svg" alt="AvtoLider" className="h-8 w-auto" />
        <span className="font-extrabold text-lg tracking-tight">{ts('header.appName')}</span>
      </div>
      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs bg-[oklch(0.588_0.158_241)] text-white font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold">{user?.firstName ?? ts('header.defaultUser')}</p>
              <p className="text-xs text-muted-foreground">{user?.phoneNumber ?? ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2 rounded-lg">
              <Settings className="h-4 w-4" /> {ts('header.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive" className="flex items-center gap-2 rounded-lg">
              <LogOut className="h-4 w-4" /> {ts('header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
