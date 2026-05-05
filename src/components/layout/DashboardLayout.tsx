import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/utils/cn';

export const DashboardLayout = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main
        className={cn(
          'pt-12 min-h-screen transition-all duration-300',
          isCollapsed ? 'pl-[64px]' : 'pl-56'
        )}
      >
        <div className="p-6 max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
