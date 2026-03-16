import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import LocaleHydrator from '@/components/locale-hydrator';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoTest — Haydovchilik imtihoniga tayyorlanish',
  description: "O'zbekiston UBDD haydovchilik nazariy imtihoniga tayyorlanish platformasi",
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
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
