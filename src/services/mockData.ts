import type { Client, Router, User, Activity, DashboardStats, BillingData, TechnicalSupport, Notification } from '@/types';

// Mock Users
export const mockAdmin: User = {
  id: '1',
  email: 'admin@nexory.com',
  name: 'Administrador',
  role: 'admin',
};

export const mockOperator: User = {
  id: '2',
  email: 'operator@nexory.com',
  name: 'Operador',
  role: 'operator',
};

// Helper para generar fechas de vencimiento variadas
const getDueDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Helper para simular variaciones en métricas
const randomVariation = (base: number, range: number) => {
  return base + (Math.random() * range * 2 - range);
};

// Mock Clients — solo clientes reales
export const mockClients: Client[] = [
  {
    id: 'cli001',
    name: 'Angie Vanesa Sanchez Cañaveral',
    documentId: '1000641109',
    plan: 'Plan 50 Mbps',
    planSpeed: 50,
    status: 'active',
    paymentDueDate: getDueDate(10),
    amount: 95000,
    createdAt: '2024-03-01',
    lastConnection: new Date().toISOString(),
    bandwidthUsage: 38.2,
    latency: 14,
    uptime: 99.5,
    location: 'Sector Norte',
    tags: ['Residencial'],
    phone: '573003198321',
    address: 'Calle 5 #12-34',
    city: 'Cartago',
    installationDate: '2024-03-01',
    contractNumber: 'CT-2024-001',
    notes: 'Cliente activo con pago al día.',
  },
  {
    id: 'cli002',
    name: 'David Stiven Lujan Foronda',
    documentId: '1001250342',
    plan: 'Plan 100 Mbps',
    planSpeed: 100,
    status: 'active',
    paymentDueDate: getDueDate(-3),
    amount: 150000,
    createdAt: '2024-01-15',
    lastConnection: new Date(Date.now() - 3600000 * 5).toISOString(),
    bandwidthUsage: 82.7,
    latency: 9,
    uptime: 98.8,
    location: 'Sector Centro',
    tags: ['Residencial'],
    phone: '573126226684',
    address: 'Carrera 8 #45-67',
    city: 'Cartago',
    installationDate: '2024-01-15',
    contractNumber: 'CT-2024-002',
    notes: 'Pago vencido. Contactar para gestión de cobro.',
  },
];

// Mock Routers con métricas completas
export const mockRouters: Router[] = [
  {
    id: '1',
    name: 'Nodo Centro',
    ip: '10.0.0.1',
    status: 'online',
    location: 'Centro de la ciudad',
    model: 'MikroTik RB4011iGS+',
    firmware: 'RouterOS 7.12',
    uptime: 99.95,
    cpuUsage: 35,
    memoryUsage: 62,
    bandwidthIn: 850,
    bandwidthOut: 420,
    connectedClients: 245,
    lastSeen: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Torre Norte',
    ip: '10.0.0.2',
    status: 'online',
    location: 'Zona Norte',
    model: 'MikroTik RB3011UiAS',
    firmware: 'RouterOS 7.11',
    uptime: 99.88,
    cpuUsage: 28,
    memoryUsage: 55,
    bandwidthIn: 620,
    bandwidthOut: 310,
    connectedClients: 180,
    lastSeen: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Torre Sur',
    ip: '10.0.0.3',
    status: 'offline',
    location: 'Zona Sur',
    model: 'MikroTik RB2011UiAS',
    firmware: 'RouterOS 7.10',
    uptime: 85.2,
    cpuUsage: 0,
    memoryUsage: 0,
    bandwidthIn: 0,
    bandwidthOut: 0,
    connectedClients: 0,
    lastSeen: '2024-03-24T14:20:00',
  },
  {
    id: '4',
    name: 'Nodo Este',
    ip: '10.0.0.4',
    status: 'online',
    location: 'Zona Este',
    model: 'MikroTik RB4011iGS+',
    firmware: 'RouterOS 7.12',
    uptime: 99.92,
    cpuUsage: 42,
    memoryUsage: 68,
    bandwidthIn: 720,
    bandwidthOut: 380,
    connectedClients: 195,
    lastSeen: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Torre Oeste',
    ip: '10.0.0.5',
    status: 'maintenance',
    location: 'Zona Oeste',
    model: 'MikroTik RB3011UiAS',
    firmware: 'RouterOS 7.11',
    uptime: 98.5,
    cpuUsage: 15,
    memoryUsage: 45,
    bandwidthIn: 180,
    bandwidthOut: 90,
    connectedClients: 45,
    lastSeen: new Date().toISOString(),
  },
];

// Mock Activities
export const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'payment_received',
    description: 'Pago recibido exitosamente',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    clientName: 'Angie Vanesa Sanchez Cañaveral',
    severity: 'success',
  },
  {
    id: '2',
    type: 'client_suspended',
    description: 'Pago vencido — pendiente de cobro',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    clientName: 'David Stiven Lujan Foronda',
    severity: 'warning',
  },
  {
    id: '3',
    type: 'router_offline',
    description: 'Router desconectado en Sector Centro',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    severity: 'error',
  },
  {
    id: '4',
    type: 'alert',
    description: 'Alta latencia detectada en Sector Norte',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    severity: 'warning',
  },
];

// Mock Billing Data
export const mockBillingData: BillingData[] = [
  { month: 'Ene 2024', revenue: 115000, clients: 980, averageRevenuePerUser: 117.35 },
  { month: 'Feb 2024', revenue: 118000, clients: 1020, averageRevenuePerUser: 115.69 },
  { month: 'Mar 2024', revenue: 125000, clients: 1100, averageRevenuePerUser: 113.64 },
  { month: 'Abr 2024', revenue: 132000, clients: 1150, averageRevenuePerUser: 114.78 },
  { month: 'May 2024', revenue: 128000, clients: 1120, averageRevenuePerUser: 114.29 },
  { month: 'Jun 2024', revenue: 135000, clients: 1180, averageRevenuePerUser: 114.41 },
];

// ============ FUNCIONES MOCK ============

// Función de login simulado (admin@nexory.com / admin123 o operator@nexory.com / operator123)
export const fakeLogin = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isAdmin = (email === 'admin' && password === 'admin') || (email === 'admin@nexory.com' && password === 'admin123');
      const isOperator = (email === 'operator' && password === 'operator') || (email === 'operator@nexory.com' && password === 'operator123');
      if (isAdmin) {
        localStorage.setItem('nexory_user', JSON.stringify(mockAdmin));
        localStorage.setItem('nexory_auth', 'true');
        resolve(mockAdmin);
      } else if (isOperator) {
        localStorage.setItem('nexory_user', JSON.stringify(mockOperator));
        localStorage.setItem('nexory_auth', 'true');
        resolve(mockOperator);
      } else {
        reject(new Error('Credenciales inválidas'));
      }
    }, 1000);
  });
};

// Función para obtener clientes
export const getClients = async (): Promise<Client[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Resetear caché si los IDs no coinciden con los clientes reales
      const stored = localStorage.getItem('nexory_clients');
      if (stored) {
        const parsed: Client[] = JSON.parse(stored);
        const hasRealClients = parsed.some(c => c.id === 'cli001' || c.id === 'cli002');
        if (!hasRealClients) {
          localStorage.removeItem('nexory_clients');
          localStorage.setItem('nexory_clients', JSON.stringify(mockClients));
          resolve(mockClients);
          return;
        }
        resolve(parsed);
      } else {
        localStorage.setItem('nexory_clients', JSON.stringify(mockClients));
        resolve(mockClients);
      }
    }, 500);
  });
};

// Función para cambiar estado de cliente
export const toggleClientStatus = async (clientId: string): Promise<Client> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_clients');
      const clients: Client[] = stored ? JSON.parse(stored) : mockClients;
      
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        reject(new Error('Cliente no encontrado'));
        return;
      }

      const oldStatus = client.status;
      client.status = client.status === 'active' ? 'suspended' : 'active';
      
      // Actualizar última conexión si se reactiva
      if (client.status === 'active' && oldStatus === 'suspended') {
        client.lastConnection = new Date().toISOString();
      }

      localStorage.setItem('nexory_clients', JSON.stringify(clients));
      
      // Agregar actividad (sin await para no bloquear)
      addActivity({
        type: client.status === 'active' ? 'client_reactivated' : 'client_suspended',
        description: client.status === 'active' 
          ? `Cliente ${client.name} reactivado`
          : `Cliente ${client.name} suspendido`,
        clientName: client.name,
        severity: client.status === 'active' ? 'success' : 'warning',
      }).catch(() => {});
      
      resolve(client);
    }, 800);
  });
};

// Función para actualizar métricas de cliente (simular cambios en tiempo real)
export const updateClientMetrics = async (clientId: string): Promise<Client> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_clients');
      const clients: Client[] = stored ? JSON.parse(stored) : mockClients;
      
      const client = clients.find(c => c.id === clientId);
      if (!client || client.status !== 'active') {
        reject(new Error('Cliente no encontrado o inactivo'));
        return;
      }

      // Simular variaciones en métricas
      if (client.bandwidthUsage) {
        client.bandwidthUsage = Math.max(0, randomVariation(client.bandwidthUsage, 5));
      }
      if (client.latency) {
        client.latency = Math.max(1, Math.round(randomVariation(client.latency, 3)));
      }
      if (client.uptime) {
        client.uptime = Math.min(100, Math.max(95, randomVariation(client.uptime, 0.5)));
      }
      client.lastConnection = new Date().toISOString();

      localStorage.setItem('nexory_clients', JSON.stringify(clients));
      resolve(client);
    }, 300);
  });
};

// Función para obtener estadísticas del dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_clients');
      const clients: Client[] = stored ? JSON.parse(stored) : mockClients;
      
      const storedRouters = localStorage.getItem('nexory_routers');
      const routers: Router[] = storedRouters ? JSON.parse(storedRouters) : mockRouters;
      
      const activeRouters = routers.filter(r => r.status === 'online').length;
      const totalBandwidth = routers
        .filter(r => r.status === 'online')
        .reduce((sum, r) => sum + r.bandwidthIn, 0);
      
      const avgLatency = clients
        .filter(c => c.status === 'active' && c.latency)
        .reduce((sum, c) => sum + (c.latency || 0), 0) / 
        clients.filter(c => c.status === 'active' && c.latency).length || 0;
      
      const networkUptime = routers
        .filter(r => r.status === 'online')
        .reduce((sum, r) => sum + r.uptime, 0) / activeRouters || 0;
      
      const stats: DashboardStats = {
        totalClients: clients.length,
        onlineClients: clients.filter(c => c.status === 'active').length,
        suspendedClients: clients.filter(c => c.status === 'suspended').length,
        overdueClients: 1,
        averageLatency: Math.round(avgLatency),
        networkUptime: Math.round(networkUptime * 100) / 100,
        totalBandwidth: totalBandwidth,
        activeRouters: activeRouters,
        totalRouters: routers.length,
        clientGrowth: 3.2,
      };
      
      resolve(stats);
    }, 300);
  });
};

// Función para obtener actividades
export const getActivities = async (): Promise<Activity[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_activities');
      if (stored) {
        resolve(JSON.parse(stored));
      } else {
        localStorage.setItem('nexory_activities', JSON.stringify(mockActivities));
        resolve(mockActivities);
      }
    }, 400);
  });
};

// Función para agregar nueva actividad
export const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_activities');
      const activities: Activity[] = stored ? JSON.parse(stored) : mockActivities;
      
      const newActivity: Activity = {
        ...activity,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      
      activities.unshift(newActivity);
      // Mantener solo las últimas 50 actividades
      if (activities.length > 50) {
        activities.splice(50);
      }
      
      localStorage.setItem('nexory_activities', JSON.stringify(activities));
      resolve(newActivity);
    }, 200);
  });
};

// Función para obtener routers
export const getRouters = async (): Promise<Router[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_routers');
      if (stored) {
        resolve(JSON.parse(stored));
      } else {
        localStorage.setItem('nexory_routers', JSON.stringify(mockRouters));
        resolve(mockRouters);
      }
    }, 500);
  });
};

// Función para actualizar métricas de router (simular tiempo real)
export const updateRouterMetrics = async (routerId: string): Promise<Router> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_routers');
      const routers: Router[] = stored ? JSON.parse(stored) : mockRouters;
      
      const router = routers.find(r => r.id === routerId);
      if (!router) {
        reject(new Error('Router no encontrado'));
        return;
      }

      if (router.status === 'online') {
        // Simular variaciones en métricas
        router.cpuUsage = Math.max(0, Math.min(100, Math.round(randomVariation(router.cpuUsage, 5))));
        router.memoryUsage = Math.max(0, Math.min(100, Math.round(randomVariation(router.memoryUsage, 3))));
        router.bandwidthIn = Math.max(0, Math.round(randomVariation(router.bandwidthIn, 50)));
        router.bandwidthOut = Math.max(0, Math.round(randomVariation(router.bandwidthOut, 25)));
        router.connectedClients = Math.max(0, Math.round(randomVariation(router.connectedClients, 5)));
        router.lastSeen = new Date().toISOString();
      }

      localStorage.setItem('nexory_routers', JSON.stringify(routers));
      resolve(router);
    }, 300);
  });
};

// Función para cambiar estado de router
export const toggleRouterStatus = async (routerId: string): Promise<Router> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_routers');
      const routers: Router[] = stored ? JSON.parse(stored) : mockRouters;
      
      const router = routers.find(r => r.id === routerId);
      if (!router) {
        reject(new Error('Router no encontrado'));
        return;
      }

      if (router.status === 'online') {
        router.status = 'offline';
        router.cpuUsage = 0;
        router.memoryUsage = 0;
        router.bandwidthIn = 0;
        router.bandwidthOut = 0;
        router.connectedClients = 0;
      } else if (router.status === 'offline') {
        router.status = 'online';
        router.cpuUsage = Math.round(randomVariation(30, 10));
        router.memoryUsage = Math.round(randomVariation(60, 10));
        router.bandwidthIn = Math.round(randomVariation(600, 200));
        router.bandwidthOut = Math.round(randomVariation(300, 100));
        router.connectedClients = Math.round(randomVariation(150, 50));
      }
      
      router.lastSeen = new Date().toISOString();
      localStorage.setItem('nexory_routers', JSON.stringify(routers));
      resolve(router);
    }, 800);
  });
};

// Función para obtener datos de facturación
export const getBillingData = async (): Promise<BillingData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_billing');
      if (stored) {
        resolve(JSON.parse(stored));
      } else {
        localStorage.setItem('nexory_billing', JSON.stringify(mockBillingData));
        resolve(mockBillingData);
      }
    }, 400);
  });
};

// Función para guardar configuración
export const saveSettings = async (settings: Record<string, any>): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = localStorage.getItem('nexory_settings');
      const currentSettings = existing ? JSON.parse(existing) : {};
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem('nexory_settings', JSON.stringify(updatedSettings));
      resolve();
    }, 500);
  });
};

// Función para obtener configuración
export const getSettings = async (): Promise<Record<string, any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_settings');
      resolve(stored ? JSON.parse(stored) : {});
    }, 200);
  });
};

// Función para exportar datos (simular descarga)
export const exportData = async (type: 'clients' | 'routers' | 'billing'): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simular descarga de archivo
      let data: any;
      let filename: string;
      
      switch (type) {
        case 'clients':
          const clients = JSON.parse(localStorage.getItem('nexory_clients') || JSON.stringify(mockClients));
          data = JSON.stringify(clients, null, 2);
          filename = `clientes_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'routers':
          const routers = JSON.parse(localStorage.getItem('nexory_routers') || JSON.stringify(mockRouters));
          data = JSON.stringify(routers, null, 2);
          filename = `routers_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'billing':
          const billing = JSON.parse(localStorage.getItem('nexory_billing') || JSON.stringify(mockBillingData));
          data = JSON.stringify(billing, null, 2);
          filename = `facturacion_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          resolve();
          return;
      }
      
      // Crear blob y descargar
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      resolve();
    }, 500);
  });
};

// Mock Technical Support Tickets
const getDateString = (daysAgo: number, hoursAgo: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

const isNewClient = (clientCreatedAt: string): boolean => {
  const created = new Date(clientCreatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30; // Nuevo si tiene menos de 30 días
};

export const mockTechnicalSupports: TechnicalSupport[] = [
  {
    id: 'ts-1',
    clientId: '1',
    clientName: 'Juan Pérez',
    clientDocumentId: '12345678-9',
    clientAddress: 'Calle 123 #45-67, Bogotá',
    clientPlan: 'Fibra 200MB',
    clientPhone: '+57 300 123 4567',
    clientEmail: 'juan.perez@email.com',
    type: 'failure',
    isNewClient: isNewClient('2024-01-15'),
    status: 'pending',
    reportedIssue: 'Cliente reporta intermitencia en la conexión durante las últimas 48 horas. La velocidad baja considerablemente en horas pico.',
    reportedAt: getDateString(0, 3),
    priority: 'high',
    createdAt: getDateString(0, 3),
    updatedAt: getDateString(0, 3),
  },
  {
    id: 'ts-2',
    clientId: '2',
    clientName: 'María González',
    clientDocumentId: '98765432-1',
    clientAddress: 'Avenida Principal #89-12, Medellín',
    clientPlan: 'Fibra 500MB',
    clientPhone: '+57 310 987 6543',
    clientEmail: 'maria.gonzalez@empresa.com',
    type: 'installation',
    isNewClient: true,
    status: 'in_progress',
    reportedIssue: 'Nueva instalación solicitada. Cliente requiere servicio empresarial con prioridad alta.',
    reportedAt: getDateString(1, 5),
    assignedTo: 'tech-1',
    assignedToName: 'Carlos Méndez',
    priority: 'high',
    createdAt: getDateString(1, 5),
    updatedAt: getDateString(0, 2),
  },
  {
    id: 'ts-3',
    clientId: '3',
    clientName: 'Carlos Rodríguez',
    clientDocumentId: '11223344-5',
    clientAddress: 'Carrera 56 #12-34, Cali',
    clientPlan: 'Fibra 100MB',
    clientPhone: '+57 315 234 5678',
    clientEmail: 'carlos.rodriguez@email.com',
    type: 'failure',
    isNewClient: isNewClient('2024-01-10'),
    status: 'reviewed',
    reportedIssue: 'Sin conexión desde ayer. El router no enciende y no hay señal de internet.',
    reportedAt: getDateString(1, 8),
    assignedTo: 'tech-2',
    assignedToName: 'Ana López',
    priority: 'urgent',
    createdAt: getDateString(1, 8),
    updatedAt: getDateString(0, 4),
    notes: 'Técnico asignado. Visita programada para mañana a las 10:00 AM.',
  },
  {
    id: 'ts-4',
    clientId: '4',
    clientName: 'Laura Martínez',
    clientDocumentId: '55667788-9',
    clientAddress: 'Calle 78 #23-45, Bogotá',
    clientPlan: 'Fibra 300MB',
    clientPhone: '+57 320 555 1234',
    clientEmail: 'laura.martinez@email.com',
    type: 'removal',
    isNewClient: isNewClient('2023-11-20'),
    status: 'pending',
    reportedIssue: 'Cliente solicita retiro del servicio. Mudanza a otra ciudad.',
    reportedAt: getDateString(2, 2),
    priority: 'low',
    createdAt: getDateString(2, 2),
    updatedAt: getDateString(2, 2),
  },
  {
    id: 'ts-5',
    clientId: '5',
    clientName: 'Roberto Silva',
    clientDocumentId: '99887766-5',
    clientAddress: 'Avenida 68 #90-12, Medellín',
    clientPlan: 'Fibra 150MB',
    clientPhone: '+57 318 777 8888',
    clientEmail: 'roberto.silva@email.com',
    type: 'failure',
    isNewClient: isNewClient('2024-02-10'),
    status: 'resolved',
    reportedIssue: 'Velocidad muy lenta. No alcanza los 150MB contratados, solo llega a 50MB.',
    reportedAt: getDateString(5, 10),
    assignedTo: 'tech-1',
    assignedToName: 'Carlos Méndez',
    priority: 'medium',
    createdAt: getDateString(5, 10),
    updatedAt: getDateString(3, 5),
    resolvedAt: getDateString(3, 5),
    notes: 'Problema resuelto. Se cambió el cable de conexión y se optimizó la configuración del router.',
  },
  {
    id: 'ts-6',
    clientId: '6',
    clientName: 'Patricia Ramírez',
    clientDocumentId: '33445566-7',
    clientAddress: 'Carrera 30 #45-67, Cali',
    clientPlan: 'Fibra 250MB',
    clientPhone: '+57 312 444 5555',
    clientEmail: 'patricia.ramirez@email.com',
    type: 'installation',
    isNewClient: true,
    status: 'in_progress',
    reportedIssue: 'Instalación nueva. Cliente requiere servicio residencial estándar.',
    reportedAt: getDateString(3, 6),
    assignedTo: 'tech-2',
    assignedToName: 'Ana López',
    priority: 'medium',
    createdAt: getDateString(3, 6),
    updatedAt: getDateString(1, 3),
  },
  {
    id: 'ts-7',
    clientId: '7',
    clientName: 'Fernando Torres',
    clientDocumentId: '11223344-8',
    clientAddress: 'Calle 50 #12-34, Bogotá',
    clientPlan: 'Fibra 400MB',
    clientPhone: '+57 315 666 7777',
    clientEmail: 'fernando.torres@email.com',
    type: 'failure',
    isNewClient: isNewClient('2023-12-15'),
    status: 'reviewed',
    reportedIssue: 'Conexión inestable. Se cae constantemente durante videollamadas.',
    reportedAt: getDateString(0, 1),
    assignedTo: 'tech-1',
    assignedToName: 'Carlos Méndez',
    priority: 'high',
    createdAt: getDateString(0, 1),
    updatedAt: getDateString(0, 0),
    notes: 'Revisado. Se requiere visita técnica para verificar instalación.',
  },
];

// Función para obtener todos los soportes técnicos
export const getTechnicalSupports = async (): Promise<TechnicalSupport[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_supports');
      const supports = stored ? JSON.parse(stored) : mockTechnicalSupports;
      resolve(supports);
    }, 300);
  });
};

// Función para actualizar el estado de un soporte
export const updateSupportStatus = async (
  supportId: string,
  status: TechnicalSupport['status'],
  assignedTo?: string,
  assignedToName?: string,
  notes?: string
): Promise<TechnicalSupport> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_supports');
      const supports: TechnicalSupport[] = stored ? JSON.parse(stored) : mockTechnicalSupports;
      const supportIndex = supports.findIndex(s => s.id === supportId);
      
      if (supportIndex === -1) {
        reject(new Error('Soporte no encontrado'));
        return;
      }

      const updatedSupport: TechnicalSupport = {
        ...supports[supportIndex],
        status,
        updatedAt: new Date().toISOString(),
        ...(assignedTo && { assignedTo, assignedToName }),
        ...(notes && { notes }),
        ...(status === 'resolved' && { resolvedAt: new Date().toISOString() }),
      };

      supports[supportIndex] = updatedSupport;
      localStorage.setItem('nexory_supports', JSON.stringify(supports));
      resolve(updatedSupport);
    }, 500);
  });
};

// Mock Notifications
const getNotificationDate = (hoursAgo: number, minutesAgo: number = 0): string => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'support_urgent',
    title: 'Nuevo soporte urgente',
    message: 'Carlos Rodríguez reportó una falla crítica sin conexión',
    timestamp: getNotificationDate(0, 30),
    read: false,
    link: '/support',
    severity: 'error',
  },
  {
    id: 'notif-2',
    type: 'support_new',
    title: 'Nueva solicitud de instalación',
    message: 'María González solicitó una nueva instalación empresarial',
    timestamp: getNotificationDate(2, 15),
    read: false,
    link: '/support',
    severity: 'info',
  },
  {
    id: 'notif-3',
    type: 'client_suspended',
    title: 'Cliente suspendido',
    message: 'Carlos Rodríguez fue suspendido por falta de pago',
    timestamp: getNotificationDate(5, 0),
    read: false,
    link: '/clients',
    severity: 'warning',
  },
  {
    id: 'notif-4',
    type: 'router_offline',
    title: 'Router desconectado',
    message: 'Router "Router-Norte-01" está offline desde hace 2 horas',
    timestamp: getNotificationDate(8, 0),
    read: true,
    link: '/routers',
    severity: 'error',
  },
  {
    id: 'notif-5',
    type: 'payment_due',
    title: 'Pago próximo a vencer',
    message: '3 clientes tienen pagos que vencen en los próximos 3 días',
    timestamp: getNotificationDate(12, 0),
    read: true,
    link: '/clients',
    severity: 'warning',
  },
  {
    id: 'notif-6',
    type: 'support_new',
    title: 'Nueva falla reportada',
    message: 'Juan Pérez reportó intermitencia en la conexión',
    timestamp: getNotificationDate(18, 0),
    read: true,
    link: '/support',
    severity: 'info',
  },
];

// Función para obtener todas las notificaciones
export const getNotifications = async (): Promise<Notification[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_notifications');
      const notifications = stored ? JSON.parse(stored) : mockNotifications;
      // Ordenar por fecha más reciente primero
      const sorted = notifications.sort((a: Notification, b: Notification) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(sorted);
    }, 200);
  });
};

// Función para marcar una notificación como leída
export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_notifications');
      const notifications: Notification[] = stored ? JSON.parse(stored) : mockNotifications;
      const notifIndex = notifications.findIndex(n => n.id === id);
      
      if (notifIndex === -1) {
        reject(new Error('Notificación no encontrada'));
        return;
      }

      const updatedNotification: Notification = {
        ...notifications[notifIndex],
        read: true,
      };

      notifications[notifIndex] = updatedNotification;
      localStorage.setItem('nexory_notifications', JSON.stringify(notifications));
      resolve(updatedNotification);
    }, 300);
  });
};

// Función para marcar todas las notificaciones como leídas
export const markAllAsRead = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem('nexory_notifications');
      const notifications: Notification[] = stored ? JSON.parse(stored) : mockNotifications;
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem('nexory_notifications', JSON.stringify(updated));
      resolve();
    }, 300);
  });
};
