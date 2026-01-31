import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <main className="lg:pl-64 flex-1 flex flex-col">
        <div className="p-4 lg:p-8 flex-1">
          <Outlet />
        </div>
        <div className="lg:pl-0">
          <Footer />
        </div>
      </main>
    </div>
  );
}
