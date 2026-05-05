import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi, WifiOff, Activity,
  TrendingUp, Server, AlertCircle, CheckCircle2, Clock,
  Users, UserCheck, AlertTriangle, Radio, TicketCheck, ListChecks,
} from 'lucide-react';
import { apiGetDashboardStats, apiGetActivities } from '@/services/api';
import type { DashboardStats, Activity as ActivityType } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* ─── Progress Bar ─────────────────────────────────────────────── */
const ProgressBar = ({ percentage, label }: { percentage: number; label: string }) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const color = clamped >= 90 ? 'bg-success' : clamped >= 60 ? 'bg-primary' : 'bg-warning';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-xs font-semibold text-text-main data-mono">{clamped.toFixed(1)}%</span>
      </div>
      <div className="w-full h-1 overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
};

/* ─── Activity Row ─────────────────────────────────────────────── */
const ACTION_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  LOGIN:               { icon: CheckCircle2, color: 'text-primary' },
  CREAR_CLIENTE:       { icon: Users,        color: 'text-success' },
  SUSPENDER_CLIENTE:   { icon: WifiOff,      color: 'text-warning' },
  REACTIVAR_CLIENTE:   { icon: Wifi,         color: 'text-success' },
  CERRAR_TICKET:       { icon: CheckCircle2, color: 'text-success' },
  AGREGAR_NOTA_TICKET: { icon: AlertCircle,  color: 'text-text-muted' },
  ENVIAR_COMUNICACION: { icon: Radio,        color: 'text-primary' },
  COMPLETAR_TAREA:     { icon: CheckCircle2, color: 'text-success' },
};

const ActivityRow = ({ activity, index }: { activity: ActivityType; index: number }) => {
  const cfg = ACTION_ICONS[activity.type] ?? { icon: Activity, color: 'text-text-muted' };
  const Icon = cfg.icon;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <td>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
          <span className="text-sm text-text-main">{activity.description}</span>
        </div>
      </td>
      <td className="text-xs text-text-muted">{activity.userName || '—'}</td>
      <td className="text-xs text-text-muted">{activity.clientName || activity.details || '—'}</td>
      <td className="text-[11px] text-text-subtle data-mono whitespace-nowrap">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {format(new Date(activity.timestamp), 'd MMM, HH:mm', { locale: es })}
        </span>
      </td>
    </motion.tr>
  );
};

/* ─── Dashboard Page ───────────────────────────────────────────── */
export const DashboardPage = () => {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([
          apiGetDashboardStats() as Promise<DashboardStats>,
          apiGetActivities() as Promise<ActivityType[]>,
        ]);
        setStats(s);
        setActivities(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-text-muted text-sm data-mono">cargando...</span>
      </div>
    );
  }

  const onlinePct = stats.totalClients > 0 ? (stats.onlineClients / stats.totalClients) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Stat Row ── */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 border border-border rounded-xl mb-6 bg-surface overflow-hidden"
      >
        {/* Clientes Totales */}
        <div className="stat-block" style={{ '--stat-accent': 'var(--color-primary)' } as React.CSSProperties}>
          <span className="stat-block-label">
            <Users className="w-3 h-3" />
            Clientes Totales
          </span>
          <span className="stat-block-value">{stats.totalClients.toLocaleString()}</span>
          <span className="stat-block-trend">{stats.suspendedClients} suspendidos</span>
        </div>

        {/* Clientes Activos */}
        <div className="stat-block" style={{ '--stat-accent': 'var(--color-primary)' } as React.CSSProperties}>
          <span className="stat-block-label">
            <UserCheck className="w-3 h-3" />
            Activos
          </span>
          <span className="stat-block-value" style={{ color: 'var(--color-primary)' }}>
            {stats.onlineClients.toLocaleString()}
          </span>
          <span className="stat-block-trend">{onlinePct.toFixed(0)}% del total</span>
        </div>

        {/* En Mora */}
        <div className="stat-block" style={{ '--stat-accent': 'var(--color-warning)' } as React.CSSProperties}>
          <span className="stat-block-label">
            <AlertTriangle className="w-3 h-3" />
            En Mora
          </span>
          <span className="stat-block-value" style={{ color: stats.overdueClients > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {stats.overdueClients.toLocaleString()}
          </span>
          <span className="stat-block-trend">
            {stats.overdueClients === 0 ? 'Sin deudas pendientes' : 'pagos vencidos'}
          </span>
        </div>

        {/* Uptime de Red */}
        <div className="stat-block" style={{ '--stat-accent': 'var(--color-success)' } as React.CSSProperties}>
          <span className="stat-block-label">
            <Radio className="w-3 h-3" />
            Uptime de Red
          </span>
          <span className="stat-block-value">
            {stats.networkUptime.toFixed(1)}
            <span className="stat-block-unit">%</span>
          </span>
          <span className="stat-block-trend">promedio de clientes</span>
        </div>
      </div>

      {/* ── Bottom sections ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Network Performance */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface border border-border rounded-xl overflow-hidden"
        >
          <div className="section-divider px-5 pt-5">
            <TrendingUp className="w-4 h-4 text-text-subtle" />
            <span className="section-divider-title">Rendimiento de Red</span>
          </div>
          <div className="px-5 pb-5 space-y-5">
            <ProgressBar percentage={onlinePct}         label="Clientes Conectados" />
            <ProgressBar percentage={stats.networkUptime} label="Disponibilidad de Red" />
            <ProgressBar
              percentage={stats.totalClients > 0 ? ((stats.totalClients - stats.overdueClients) / stats.totalClients) * 100 : 100}
              label="Clientes al Día"
            />
          </div>

          {/* Mini metrics row */}
          <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
            {[
              { label: 'Latencia', value: `${stats.averageLatency}ms` },
              { label: 'Tickets Abiertos', value: String(stats.openTickets) },
              { label: 'Tareas Pendientes', value: String(stats.pendingTasks) },
            ].map(m => (
              <div key={m.label} className="px-4 py-3 text-center">
                <span className="section-label block mb-1">{m.label}</span>
                <span className="text-sm font-semibold data-mono text-text-main">{m.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface border border-border rounded-xl overflow-hidden"
        >
          <div className="section-divider px-5 pt-5">
            <Server className="w-4 h-4 text-text-subtle" />
            <span className="section-divider-title">Resumen Rápido</span>
          </div>
          <div className="px-5 pb-5 space-y-0">
            {[
              { label: 'Tasa de Activos',    value: `${onlinePct.toFixed(1)}%`,        icon: CheckCircle2 },
              { label: 'Tickets Abiertos',   value: `${stats.openTickets}`,             icon: TicketCheck  },
              { label: 'Tareas Pendientes',  value: `${stats.pendingTasks}`,            icon: ListChecks   },
            ].map((row, i) => {
              const RIcon = row.icon;
              return (
                <div key={row.label} className={`flex items-center justify-between py-4 ${i < 2 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center gap-3">
                    <RIcon className="w-4 h-4 text-text-subtle" />
                    <span className="text-sm text-text-muted">{row.label}</span>
                  </div>
                  <span className="text-xl font-bold data-mono text-text-main">{row.value}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Recent Activity ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-6 bg-surface border border-border rounded-xl overflow-hidden"
      >
        <div className="section-divider px-5 pt-5">
          <Activity className="w-4 h-4 text-text-subtle" />
          <span className="section-divider-title">Actividad Reciente</span>
          <span className="ml-auto section-label">{activities.length} eventos</span>
        </div>
        <div className="px-5 pb-2 overflow-x-auto">
          <table className="line-table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Cliente / Detalle</th>
                <th>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <ActivityRow key={a.id} activity={a} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
