import { motion } from 'framer-motion';
import { LogOut, Sun, Moon, Menu } from 'lucide-react';
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
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
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
        'h-12 fixed top-0 right-0 flex items-center justify-between px-3 sm:px-5 z-40 transition-all duration-300',
        'bg-surface border-b border-border',
        // On mobile always full-width (left-0); on desktop offset by sidebar
        isMobile ? 'left-0' : (isCollapsed ? 'left-[64px]' : 'left-56'),
      )}
    >
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-2 min-w-0">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-text-subtle hover:text-text-main hover:bg-black/[0.06] transition-colors flex-shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span
          className="text-text-main truncate"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: isMobile ? '14px' : '15px', letterSpacing: '-0.01em' }}
        >
          {pageTitle}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
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
        <div className="w-px h-4 bg-border mx-0.5 sm:mx-1" />

        {/* User chip — hide name on very small screens */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 rounded border border-border bg-surface hover:bg-surface-raised transition-colors">
          <Avatar name={user?.name || 'Admin'} size="sm" />
          <div className="hidden sm:flex flex-col leading-none">
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
