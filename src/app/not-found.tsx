import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground max-w-sm">
        Kechirasiz, siz izlayotgan sahifa topilmadi yoki ko&apos;chirilgan.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
