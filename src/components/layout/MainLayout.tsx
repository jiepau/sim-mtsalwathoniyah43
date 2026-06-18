import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { TopBar } from './TopBar';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { WhatsNewDialog } from '@/components/WhatsNewDialog';

export function MainLayout() {
  useIdleLogout();
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Sidebar />
      <main className="lg:pl-64 flex flex-col min-h-[calc(100vh-3.5rem)]">
        <div className="p-3 sm:p-4 lg:p-8 pb-16 lg:pb-20 flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
      <Footer />
      <WhatsNewDialog />
    </div>
  );
}
