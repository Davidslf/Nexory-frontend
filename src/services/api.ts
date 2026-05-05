const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('nexory-token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const req = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers as Record<string, string> || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── Auth ─────────────────────────────────────────────────────────
export type LoginStep1Response = {
  message: string;
  userId: string;
  phoneMasked?: string;
  devCode?: string; // solo en development
};

export type LoginStep2Response = {
  token: string;
  user: { id: string; username: string; email: string; name: string; role: string };
};

export type MeResponse = {
  id: string; username: string; email: string; name: string; role: string;
};

export const apiLoginStep1 = (username: string, password: string) =>
  req<LoginStep1Response>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const apiLoginStep2 = (userId: string, code: string) =>
  req<LoginStep2Response>('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, code }),
  });

export const apiGetMe = () => req<MeResponse>('/auth/me');

// ─── Dashboard ────────────────────────────────────────────────────
export const apiGetDashboardStats = () =>
  req<Record<string, unknown>>('/dashboard/stats');

export const apiGetActivities = () =>
  req<unknown[]>('/dashboard/activities');

// ─── Clients ──────────────────────────────────────────────────────
export const apiGetClients = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return req<unknown[]>(`/clients${qs}`);
};

export const apiGetClientById = (id: string) =>
  req<unknown>(`/clients/${id}`);

export const apiToggleClientStatus = (id: string) =>
  req<unknown>(`/clients/${id}/toggle-status`, { method: 'PATCH' });

export const apiGetClientHistory = (id: string) =>
  req<unknown[]>(`/clients/${id}/history`);

// ─── Support ──────────────────────────────────────────────────────
export const apiGetTickets = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return req<unknown[]>(`/support${qs}`);
};

export const apiCreateTicket = (body: unknown) =>
  req<unknown>('/support', { method: 'POST', body: JSON.stringify(body) });

export const apiUpdateTicket = (id: string, body: unknown) =>
  req<unknown>(`/support/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const apiCloseTicket = (id: string, body: { resolution?: string; [key: string]: unknown }) =>
  req<unknown>(`/support/${id}/close`, { method: 'POST', body: JSON.stringify(body) });

export const apiAddTicketNote = (id: string, content: string, author: string) =>
  req<unknown>(`/support/${id}/notes`, { method: 'POST', body: JSON.stringify({ content, author }) });

// ─── Tasks ────────────────────────────────────────────────────────
export const apiGetTasks = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return req<unknown[]>(`/tasks${qs}`);
};

export const apiCompleteTask = (id: string) =>
  req<unknown>(`/tasks/${id}/complete`, { method: 'PATCH' });

// ─── Communications ───────────────────────────────────────────────
export const apiGetCommunications = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return req<unknown[]>(`/communications${qs}`);
};

export const apiSendCommunication = (body: {
  type: string;
  title: string;
  body: string;
  clientIds: string[] | 'all';
  channels?: string[];
}) => req<{ sent: number; failed: number; total: number }>(
  '/communications/send',
  { method: 'POST', body: JSON.stringify(body) }
);

// ─── Cuts ─────────────────────────────────────────────────────────
export const apiGetCuts = () => req<unknown[]>('/cuts');
export const apiExecuteCut = (id: string) => req<unknown>(`/cuts/${id}/execute`, { method: 'PATCH' });
export const apiRestoreCut = (id: string) => req<unknown>(`/cuts/${id}/restore`, { method: 'PATCH' });

// ─── Network / Diagnostics (stub — no backend yet) ────────────────
export const apiDiagnoseClient = (_id: string): Promise<null> => Promise.reject(new Error('not implemented'));

// ─── MikroTik ─────────────────────────────────────────────────────
export const apiMikrotikStatus   = () => req<{ success: boolean; version?: string }>('/mikrotik/status');
export const apiMikrotikClientes = () => req<{ success: boolean; data: unknown[] }>('/mikrotik/clientes');
export const apiMikrotikActivos  = () => req<{ success: boolean; data: unknown[] }>('/mikrotik/clientes/activos');
export const apiMikrotikSync     = () => req<{ success: boolean; message: string; created: number; skipped: number }>('/mikrotik/sync', { method: 'POST' });
export const apiMikrotikActivar   = (username: string) => req<{ success: boolean }>(`/mikrotik/clientes/${username}/activar`,   { method: 'POST' });
export const apiMikrotikDesactivar = (username: string) => req<{ success: boolean }>(`/mikrotik/clientes/${username}/desactivar`, { method: 'POST' });
