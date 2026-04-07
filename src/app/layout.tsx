import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/sonner';
import LocaleHydrator from '@/components/locale-hydrator';
import SwRegister from '@/components/sw-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'AvtoLider — Haydovchilik imtihoniga tayyorlanish',
  description: "O'zbekiston UBDD haydovchilik nazariy imtihoniga tayyorlanish platformasi",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AvtoLider' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <LocaleHydrator />
        <SwRegister />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
