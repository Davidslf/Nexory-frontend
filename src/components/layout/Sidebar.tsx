import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Scissors,
  MessageSquare,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Logo, LogoIcon } from '@/components/ui/Logo';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { canAccessRoute } from '@/utils/permissions';

const allNavItems = [
  { path: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/clients',        label: 'Clientes',         icon: Users           },
  { path: '/support',        label: 'Soporte Técnico',  icon: Wrench          },
  { path: '/cuts',           label: 'Cortes',           icon: Scissors        },
  { path: '/communications', label: 'Comunicados',      icon: MessageSquare   },
  { path: '/settings',       label: 'Configuración',    icon: Settings        },
];

const UserAvatar = ({ name, role, collapsed }: { name: string; role: string; collapsed: boolean }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatar = (
    <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-primary leading-none">{initials}</span>
    </div>
  );
  if (collapsed) return (
    <Tooltip content={`${name} · ${role}`} side="right">{avatar}</Tooltip>
  );
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {avatar}
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-text-main truncate leading-tight">{name}</p>
        <p className="text-[10px] text-text-subtle truncate leading-none mt-0.5">{role}</p>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const { user } = useAuth();
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();

  const navItems = allNavItems.filter(item => canAccessRoute(user?.role, item.path));
  const roleName = user?.role === 'admin' ? 'Administrador' : 'Operador';

  // On mobile the sidebar is always "expanded" (never collapsed) — it slides in/out as a drawer
  const collapsed = isMobile ? false : isCollapsed;

  const sidebarContent = (
    <aside
      className={cn(
        'h-screen flex flex-col z-50 transition-all duration-300',
        'bg-surface border-r border-border',
        // Mobile: fixed drawer sliding from left
        isMobile
          ? cn(
              'fixed left-0 top-0 w-[260px] shadow-2xl',
              isMobileOpen ? 'translate-x-0' : '-translate-x-full',
            )
          // Desktop: fixed sidebar, collapsible
          : cn(
              'fixed left-0 top-0',
              collapsed ? 'w-[64px]' : 'w-[220px]',
            ),
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          'flex items-center border-b border-border relative',
          collapsed ? 'h-14 justify-center px-3' : 'h-14 px-4 gap-3',
        )}
      >
        {collapsed ? (
          <Tooltip content="Nexory" side="right">
            <span>
              <LogoIcon size={28} />
            </span>
          </Tooltip>
        ) : (
          <>
            <LogoIcon size={28} />
            <div className="flex flex-col min-w-0">
              <span
                className="text-text-main leading-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.03em' }}
              >
                Nexory
              </span>
              <span className="text-[10px] text-text-subtle font-medium tracking-wide">ISP Management</span>
            </div>
          </>
        )}

        {/* Mobile: close button | Desktop: collapse toggle */}
        {isMobile ? (
          <button
            onClick={closeMobileSidebar}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-subtle hover:text-text-main hover:bg-black/[0.06] transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className={cn(
              'absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center z-10',
              'bg-surface border border-border text-text-subtle shadow-sm',
              'hover:text-text-main hover:border-border transition-colors',
            )}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed
              ? <ChevronRight className="w-2.5 h-2.5" />
              : <ChevronLeft  className="w-2.5 h-2.5" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-px overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const link = (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? closeMobileSidebar : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2.5 rounded-lg transition-all duration-100 group',
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-primary/[0.08] text-text-main nav-active-bar'
                    : 'text-text-muted hover:text-text-main hover:bg-black/[0.04]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'flex-shrink-0 transition-colors',
                      collapsed ? 'w-[18px] h-[18px]' : 'w-[15px] h-[15px]',
                      isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-main',
                    )}
                  />
                  {!collapsed && (
                    <span className="text-[13px] font-medium flex-1">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} content={item.label} side="right">
                <span className="block">{link}</span>
              </Tooltip>
            );
          }
          return <span key={item.path} className="block">{link}</span>;
        })}
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-border', collapsed ? 'p-2 flex flex-col items-center gap-2' : 'px-3 py-3')}>
        {user && (
          <UserAvatar
            name={user.name}
            role={roleName}
            collapsed={collapsed}
          />
        )}
        {!collapsed && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            <span className="text-[10px] text-text-subtle" style={{ fontFamily: 'var(--font-mono)' }}>v1.0.0-beta</span>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
      {sidebarContent}
    </>
  );
};
