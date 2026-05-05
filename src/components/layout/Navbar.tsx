import { motion } from 'framer-motion';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useSidebar } from '@/context/SidebarContext';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':      'Panel de Control',
  '/tasks':          'Cola de Tareas',
  '/clients':        'Clientes',
  '/support':        'Soporte Técnico',
  '/cuts':           'Cortes',
  '/communications': 'Comunicados',
  '/settings':       'Configuración',
  '/routers':        'Routers',
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const { theme, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDark = theme === 'dark';
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Nexory';

  return (
    <header
      className={cn(
        'h-12 fixed top-0 right-0 flex items-center justify-between px-5 z-40 transition-all duration-300',
        'bg-surface border-b border-border',
        isCollapsed ? 'left-[64px]' : 'left-56'
      )}
    >
      {/* Page title */}
      <span
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}
        className="text-text-main"
      >
        {pageTitle}
      </span>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <NotificationDropdown />

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggle}
          className="p-1.5 rounded text-text-subtle hover:text-text-main hover:bg-black/[0.04] transition-colors"
          aria-label="Cambiar tema"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        {/* Separator */}
        <div className="w-px h-4 bg-border mx-1" />

        {/* User chip */}
        <div className="flex items-center gap-2 px-2 py-1 rounded border border-border bg-surface hover:bg-surface-raised transition-colors">
          <Avatar name={user?.name || 'Admin'} size="sm" />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-medium text-text-main">{user?.name}</span>
            <span
              className="text-[9px] text-text-subtle uppercase mt-0.5"
              style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}
            >
              {user?.role || 'Admin'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleLogout}
          className="ml-0.5 p-1.5 rounded text-text-subtle hover:text-danger hover:bg-danger/[0.06] transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>
    </header>
  );
};
