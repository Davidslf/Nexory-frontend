import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/utils/cn';

export const DashboardLayout = () => {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main
        className={cn(
          'pt-12 min-h-screen transition-all duration-300',
          // Mobile: no left offset (sidebar is overlay drawer)
          // Desktop: offset by sidebar width
          isMobile ? 'pl-0' : (isCollapsed ? 'pl-[64px]' : 'pl-56'),
        )}
      >
        <div className="p-3 sm:p-6 max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
