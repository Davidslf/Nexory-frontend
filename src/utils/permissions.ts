import type { UserRole } from '@/types';

export type Permission =
  | 'view_dashboard'
  | 'view_clients'
  | 'view_settings'
  | 'view_support'
  | 'view_cuts'
  | 'view_communications'
  | 'view_tasks'
  | 'edit_clients'
  | 'suspend_clients'
  | 'export_data'
  | 'view_financials'
  | 'manage_settings'
  | 'manage_support';

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_clients',
    'view_settings',
    'view_support',
    'view_cuts',
    'view_communications',
    'view_tasks',
    'edit_clients',
    'suspend_clients',
    'export_data',
    'view_financials',
    'manage_settings',
    'manage_support',
  ],
  operator: [
    'view_dashboard',
    'view_clients',
    'view_support',
    'view_cuts',
    'view_communications',
    'view_tasks',
    'edit_clients',
    'manage_support',
    // Operator NO puede: suspender clientes, exportar, ver finanzas, configuraciones
  ],
};

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
};

export const canAccessRoute = (role: UserRole | undefined, route: string): boolean => {
  if (!role) return false;

  const routePermissions: Record<string, Permission> = {
    '/dashboard':      'view_dashboard',
    '/clients':        'view_clients',
    '/settings':       'view_settings',
    '/support':        'view_support',
    '/cuts':           'view_cuts',
    '/communications': 'view_communications',
    '/tasks':          'view_tasks',
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) return true; // Rutas sin permiso específico son accesibles

  return hasPermission(role, requiredPermission);
};
