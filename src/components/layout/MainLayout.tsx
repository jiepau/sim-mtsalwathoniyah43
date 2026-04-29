import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { TopBar } from './TopBar';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <main className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="p-3 sm:p-4 lg:p-8 flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
        <div className="lg:pl-0">
          <Footer />
        </div>
      </main>
    </div>
  );
}
