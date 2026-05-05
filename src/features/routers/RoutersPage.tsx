import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Router as RouterIcon, Wifi, WifiOff, AlertCircle,
  Cpu, HardDrive, Activity, TrendingUp, MapPin, Clock, Users,
} from 'lucide-react';
import { getRouters, updateRouterMetrics } from '@/services/mockData';
import { Pill } from '@/components/ui/Pill';
import type { Router } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* ─── Router status badge ──────────────────────────────────────── */
const RouterStatus = ({ status }: { status: Router['status'] }) => {
  const map = {
    online:      { cls: 'badge-online',       dot: 'bg-success', label: 'Online',        Icon: Wifi },
    offline:     { cls: 'badge-offline',      dot: 'bg-danger',  label: 'Offline',       Icon: WifiOff },
    maintenance: { cls: 'badge-maintenance',  dot: 'bg-warning', label: 'Mantenimiento', Icon: AlertCircle },
  };
  const { cls, dot, label, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

/* ─── Progress bar ─────────────────────────────────────────────── */
const UsageBar = ({ value, delay }: { value: number; delay: number }) => {
  const color = value > 80 ? 'bg-danger' : value > 50 ? 'bg-warning' : 'bg-success';
  return (
    <div className="w-full bg-border rounded-full h-1.5 mt-1.5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, delay, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
};

/* ─── Router card ──────────────────────────────────────────────── */
const RouterCard = ({ router, index }: { router: Router; index: number }) => {
  const isOnline      = router.status === 'online';
  const isMaintenance = router.status === 'maintenance';

  const iconBg = isOnline
    ? 'bg-success/10 border-success/20 text-success'
    : isMaintenance
    ? 'bg-warning/10 border-warning/20 text-warning'
    : 'bg-danger/10  border-danger/20  text-danger';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="bg-surface border border-border rounded-lg p-5 rounded-xl overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-md border ${iconBg}`}>
            <RouterIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main">{router.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted">{router.location}</span>
            </div>
          </div>
        </div>
        <RouterStatus status={router.status} />
      </div>

      {/* CPU + Memory */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { icon: Cpu,       label: 'CPU',     value: router.cpuUsage,    delay: index * 0.08 + 0.2 },
          { icon: HardDrive, label: 'Memoria', value: router.memoryUsage, delay: index * 0.08 + 0.3 },
        ].map(({ icon: Icon, label, value, delay }) => (
          <div key={label} className="bg-background border border-border rounded-md px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
              <span className="text-xs font-semibold text-text-main data-mono">{value}%</span>
            </div>
            <UsageBar value={value} delay={delay} />
          </div>
        ))}
      </div>

      {/* Bandwidth (online only) */}
      {isOnline && (
        <div className="mb-4 px-3 py-2.5 rounded-md bg-primary/[0.06] border border-primary/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary/80">Bandwidth</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-text-main data-mono">↓ {router.bandwidthIn} Mbps</p>
              <p className="text-[10px] text-text-muted data-mono">↑ {router.bandwidthOut} Mbps</p>
            </div>
          </div>
        </div>
      )}

      {/* Pills */}
      {isOnline && (
        <div className="flex gap-2 mb-4">
          <Pill label="Uptime"   value={`${router.uptime}%`}           variant="success" icon={<Activity className="w-3 h-3" />} />
          <Pill label="Clientes" value={router.connectedClients}       variant="primary" icon={<Users    className="w-3 h-3" />} />
        </div>
      )}

      {/* Footer info */}
      <div className="pt-3 border-t border-border space-y-1.5">
        {[
          { label: 'IP',       value: router.ip },
          { label: 'Modelo',   value: router.model },
          { label: 'Firmware', value: router.firmware },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-text-muted">{row.label}</span>
            <span className="text-text-main font-medium data-mono">{row.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-text-muted pt-1">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(router.lastSeen), "d MMM yyyy, HH:mm", { locale: es })}</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Routers Page ─────────────────────────────────────────────── */
export const RoutersPage = () => {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRouters();
    const iv = setInterval(async () => {
      const current = await getRouters();
      await Promise.all(current.filter(r => r.status === 'online').map(r => updateRouterMetrics(r.id).catch(() => {})));
      loadRouters();
    }, 10_000);
    return () => clearInterval(iv);
  }, []);

  const loadRouters = async () => {
    try { setLoading(true); setRouters(await getRouters()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-text-muted text-sm data-mono">cargando routers...</span>
    </div>
  );

  const onlineCount     = routers.filter(r => r.status === 'online').length;
  const totalBandwidth  = routers.filter(r => r.status === 'online').reduce((s, r) => s + r.bandwidthIn, 0);
  const totalClients    = routers.filter(r => r.status === 'online').reduce((s, r) => s + r.connectedClients, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Routers</h1>
          <p className="text-sm text-text-muted mt-0.5">Monitoreo en tiempo real de infraestructura</p>
        </div>
        <Pill label="Online" value={`${onlineCount}/${routers.length}`} variant="success" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Routers Activos',      value: onlineCount,         cls: 'badge-active',  accent: 'text-success' },
          { label: 'Ancho de Banda Total', value: `${totalBandwidth} Mbps`, cls: 'badge-active', accent: 'text-primary' },
          { label: 'Clientes Conectados',  value: totalClients,        cls: 'badge-active',  accent: 'text-text-main' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface border border-border rounded-lg px-5 py-4 rounded-xl overflow-hidden"
          >
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-3xl font-bold data-mono ${s.accent}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routers.map((router, i) => (
          <RouterCard key={router.id} router={router} index={i} />
        ))}
      </div>
    </div>
  );
};
