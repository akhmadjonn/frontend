import AuthGuard from '@/components/auth/auth-guard';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import AnnouncementBanner from '@/components/layout/announcement-banner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <AnnouncementBanner />
          <Header />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </AuthGuard>
  );
}
