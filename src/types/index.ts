export type UserRole = 'admin' | 'operator';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

export interface Client {
  id: string;
  name: string;
  documentId: string;
  plan: string;
  planSpeed: number; // Mbps
  status: 'active' | 'suspended' | 'pending';
  paymentDueDate: string;
  amount: number;
  createdAt: string;
  lastConnection?: string;
  bandwidthUsage?: number; // GB
  latency?: number; // ms
  uptime?: number; // percentage
  location?: string;
  tags?: string[];
  // Información detallada para el acordeón
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  installationDate?: string;
  contractNumber?: string;
  notes?: string;
}

export interface Router {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'maintenance';
  location: string;
  model: string;
  firmware: string;
  uptime: number; // percentage
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  bandwidthIn: number; // Mbps
  bandwidthOut: number; // Mbps
  connectedClients: number;
  lastSeen: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userName?: string;
  clientName?: string;
  details?: string;
  entity?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  ip?: string;
}

export interface DashboardStats {
  totalClients: number;
  onlineClients: number;
  suspendedClients: number;
  overdueClients: number;
  openTickets: number;
  pendingTasks: number;
  averageLatency: number;
  networkUptime: number;
  clientGrowth: number; // percentage
}

export interface BillingData {
  month: string;
  revenue: number;
  clients: number;
  averageRevenuePerUser: number;
}

export interface NetworkMetric {
  timestamp: string;
  bandwidth: number;
  latency: number;
  uptime: number;
}

export interface TechnicalSupport {
  id: string;
  clientId: string;
  clientName: string;
  clientDocumentId: string;
  clientAddress: string;
  clientPlan: string;
  clientPhone?: string;
  clientEmail?: string;
  type: 'installation' | 'failure' | 'removal'; // instalación, falla, retiro
  isNewClient: boolean; // true si es nuevo, false si tiene más de un mes
  status: 'pending' | 'in_progress' | 'reviewed' | 'resolved' | 'cancelled';
  reportedIssue?: string; // Descripción de la falla reportada
  reportedAt: string; // Fecha y hora del reporte
  assignedTo?: string; // ID del técnico asignado
  assignedToName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes?: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────
export type TaskPriority = 'urgent' | 'high' | 'normal';
export type TaskType = 'suspend_client' | 'assign_ticket' | 'review_message' | 'follow_up';

export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  title: string;
  description: string;
  clientId?: string;
  clientName?: string;
  ticketId?: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

// ─── Network Health ───────────────────────────────────────────────────
export type NetworkStatus = 'green' | 'yellow' | 'red';

export interface NetworkHealth {
  status: NetworkStatus;
  latencyAvg: number;
  packetLoss: number;
  routersOnline: number;
  routersTotal: number;
  lastChecked: string;
  issues: { id: string; description: string; severity: 'warning' | 'error' }[];
}

// ─── Anomalies ────────────────────────────────────────────────────────
export type AnomalySeverity = 'warning' | 'error';

export interface Anomaly {
  id: string;
  type: string;
  title: string;
  description: string;
  clientId?: string;
  routerId?: string;
  clientName?: string;
  severity: AnomalySeverity;
  detectedAt: string;
  resolved: boolean;
}

// ─── Client Communication History ─────────────────────────────────────
export interface ClientCommHistory {
  id: string;
  title: string;
  type: string;
  status: string;
  sentAt: string;
  channels: string[];
  deliveryStatus: 'sent' | 'failed' | 'pending' | 'unknown';
}

// ─── Ticket Closure ────────────────────────────────────────────────────
export interface TicketClosureChecklist {
  item: string;
  checked: boolean;
}

export interface Notification {
  id: string;
  type: 'support_new' | 'support_urgent' | 'client_suspended' | 'router_offline' | 'payment_due' | 'system_alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string; // Ruta a donde navegar al hacer clic
  severity?: 'info' | 'warning' | 'error' | 'success';
}
