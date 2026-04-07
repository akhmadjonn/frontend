'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';

export default function HomePage() {
  const { ts } = useLocale();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[oklch(0.985_0.003_80)] to-white dark:from-slate-950 dark:to-slate-900">
      <header className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src="/logo-full.svg" alt="AvtoLider" width={64} height={34} priority />
          <span className="font-extrabold text-xl tracking-tight">AvtoLider</span>
        </div>
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {ts('auth.loginButton') || 'Kirish'}
        </Link>
      </header>

      <main className="container mx-auto px-6 py-20 text-center animate-fade-up">
        <div className="mx-auto mb-8 flex justify-center">
          <Image src="/logo-full.svg" alt="AvtoLider" width={280} height={150} priority />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          {ts('marketing.homeTitle')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {ts('marketing.homeSubtitle') || "O'zbekiston UBDD haydovchilik nazariy imtihoniga tayyorlanish platformasi"}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-xl btn-gradient-blue px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            {ts('landing.getStarted') || "Boshlash"}
          </Link>
          <Link
            href="/about"
            className="rounded-xl border border-border/50 px-8 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {ts('landing.learnMore') || "Batafsil"}
          </Link>
        </div>
      </main>
    </div>
  );
}
