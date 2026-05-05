import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, ChevronDown, ChevronUp, ArrowUpDown,
  CreditCard, MapPin, Phone, Mail,
  Calendar, FileText, Wifi, Gauge, Activity, Clock,
  Search, Users, UserCheck, UserX,
  CheckCircle2, AlertCircle, XCircle, Power, RefreshCw,
  Home, Building2, Briefcase, MessageSquare, Ticket,
} from 'lucide-react';
import { apiGetClients, apiToggleClientStatus, apiMikrotikSync } from '@/services/api';
import { toast } from 'sonner';
import { exportData } from '@/services/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';
import { differenceInDays, format as formatDate, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { ClientHistoryPanel } from './ClientHistoryPanel';
import { useNavigate } from 'react-router-dom';

/* ─── Service type ────────────────────────────────────────────── */
type ServiceType = 'hogar' | 'negocio' | 'empresa' | null;

const detectServiceType = (tags?: string[]): ServiceType => {
  if (!tags?.length) return null;
  const t = tags.map(s => s.toLowerCase());
  if (t.some(s => ['hogar', 'home', 'residencial'].includes(s))) return 'hogar';
  if (t.some(s => ['negocio', 'business', 'comercial'].includes(s))) return 'negocio';
  if (t.some(s => ['empresa', 'enterprise', 'corporativo'].includes(s))) return 'empresa';
  return null;
};

const SERVICE_CFG: Record<NonNullable<ServiceType>, { label: string; icon: React.ElementType; cls: string }> = {
  hogar:   { label: 'Hogar',   icon: Home,      cls: 'text-primary border-primary/20 bg-primary/[0.07]' },
  negocio: { label: 'Negocio', icon: Building2, cls: 'text-[#7c3aed] border-[#7c3aed]/20 bg-[#7c3aed]/[0.06]' },
  empresa: { label: 'Empresa', icon: Briefcase, cls: 'text-warning border-warning/20 bg-warning/[0.07]' },
};

const ServiceTag = ({ type }: { type: ServiceType }) => {
  if (!type) return <span className="text-[11px] text-text-muted/40">—</span>;
  const cfg = SERVICE_CFG[type];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap',
      cfg.cls
    )}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {cfg.label}
    </span>
  );
};

/* ─── Status pill — fixed width ───────────────────────────────── */
const StatusPill = ({ status }: { status: Client['status'] }) => {
  const cfg = {
    active:    { label: 'Activo',     dot: 'bg-success', cls: 'text-success border-success/25 bg-success/[0.07]' },
    suspended: { label: 'Suspendido', dot: 'bg-danger',  cls: 'text-danger  border-danger/25  bg-danger/[0.07]'  },
    pending:   { label: 'Pendiente',  dot: 'bg-warning', cls: 'text-warning border-warning/25 bg-warning/[0.07]' },
  }[status] ?? { label: status, dot: 'bg-text-muted', cls: 'text-text-muted border-border' };

  return (
    <span className={cn(
      'inline-flex items-center justify-center gap-1.5 w-[108px]',
      'text-[11px] font-semibold border rounded-full px-3 py-1',
      cfg.cls
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
};

/* ─── Payment pill — fixed width ──────────────────────────────── */
const PaymentPill = ({ dueDate }: { dueDate: string }) => {
  const days = differenceInDays(new Date(dueDate), new Date());
  const cfg = days > 5
    ? { label: 'Al día',       icon: CheckCircle2, cls: 'text-success border-success/25 bg-success/[0.07]' }
    : days >= 0
    ? { label: 'Vence pronto', icon: AlertCircle,  cls: 'text-warning border-warning/25 bg-warning/[0.07]' }
    : { label: 'Vencido',      icon: XCircle,      cls: 'text-danger  border-danger/25  bg-danger/[0.07]'  };
  const Icon = cfg.icon;

  return (
    <span className={cn(
      'inline-flex items-center justify-center gap-1.5 w-[118px]',
      'text-[11px] font-semibold border rounded-full px-3 py-1',
      cfg.cls
    )}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {cfg.label}
    </span>
  );
};

/* ─── Action button — fixed width ─────────────────────────────── */
const ActionButton = ({ isActive, loading, onClick }: { isActive: boolean; loading: boolean; onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    disabled={loading}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border',
      'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-[100px] justify-center',
      isActive
        ? 'text-danger border-danger/20 bg-danger/[0.05] hover:bg-danger/[0.10]'
        : 'text-success border-success/20 bg-success/[0.05] hover:bg-success/[0.10]'
    )}
  >
    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
    {loading ? '...' : isActive ? 'Cortar' : 'Reconectar'}
  </motion.button>
);

/* ─── Sort header ─────────────────────────────────────────────── */
type SortKey = 'name' | 'amount';
type SortDir = 'asc' | 'desc';

const SortHeader = ({ label, sortKey, active, dir, onClick }: {
  label: string; sortKey: SortKey; active: boolean; dir: SortDir; onClick: () => void;
}) => (
  <button onClick={onClick} className="inline-flex items-center gap-1 group text-left">
    <span className={cn('text-[10px] font-bold uppercase tracking-[0.12em]',
      active ? 'text-text-main' : 'text-text-muted group-hover:text-text-main transition-colors')}>
      {label}
    </span>
    {active
      ? (dir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />)
      : <ArrowUpDown className="w-3 h-3 text-text-muted/40 group-hover:text-text-muted transition-colors" />}
  </button>
);

/* ─── Helpers ─────────────────────────────────────────────────── */
const nextPaymentDate = (dueDay: number): string => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), dueDay);
  return d > now
    ? d.toISOString().split('T')[0]
    : new Date(now.getFullYear(), now.getMonth() + 1, dueDay).toISOString().split('T')[0];
};

const mapClient = (c: any): Client => ({
  ...c,
  amount: c.monthlyFee,
  status: (c.status as string).toLowerCase() as Client['status'],
  paymentDueDate: nextPaymentDate(c.paymentDueDay),
});

/* ─── Column grid ─────────────────────────────────────────────── */
// Contract rows align to this grid (indented via pl on the first cell)
const CONTRACT_COLS = 'grid grid-cols-[minmax(0,1fr)_88px_118px_126px_106px_152px] items-center';

/* ─── Stat card ───────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, sub, delay = 0 }: {
  icon: React.ElementType; label: string; value: number; color: string; sub?: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.32, delay }}
    className="flex-1 min-w-0 rounded-xl border border-border bg-surface p-5"
    style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2px 7px' }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.14em] mb-3">{label}</p>
        <p className={cn('text-[2.2rem] font-bold leading-none tabular-nums', color)}>{value}</p>
        {sub && <p className="text-[11px] text-text-muted mt-2">{sub}</p>}
      </div>
      <div className={cn('p-2.5 rounded-xl border border-border bg-surface-raised', color)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

/* ─── Detail field ────────────────────────────────────────────── */
const DetailField = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="p-1.5 rounded-lg bg-surface-raised mt-0.5 flex-shrink-0">
      <Icon className="w-3 h-3 text-text-muted" />
    </div>
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-sm text-text-main mt-0.5">{value}</p>
    </div>
  </div>
);

/* ─── Skeleton ────────────────────────────────────────────────── */
const SkeletonRow = ({ delay = 0 }: { delay?: number }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
    className="px-5 py-4 border-b border-border flex items-center gap-3">
    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-3.5 w-48" />
      <Skeleton className="h-2.5 w-28" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </motion.div>
);

/* ─── Contract row (level 2) ──────────────────────────────────── */
const ContractRow = ({
  client, isExpanded, onToggle, onToggleStatus, actionLoading, canSuspend, onViewHistory, isLast,
}: {
  client: Client; isExpanded: boolean; onToggle: () => void;
  onToggleStatus: () => void; actionLoading: boolean;
  canSuspend: boolean; onViewHistory: () => void; isLast: boolean;
}) => {
  const navigate = useNavigate();
  const isActive = client.status === 'active';
  const serviceType = detectServiceType(client.tags);
  const docLabel = serviceType === 'empresa' ? 'NIT' : 'CC';

  return (
    <>
      {/* Contract summary row */}
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onToggle}
        className={cn(
          CONTRACT_COLS,
          'gap-4 pl-14 pr-5 py-3 cursor-pointer select-none',
          'hover:bg-surface-raised/30 transition-colors duration-100',
          isExpanded && 'bg-surface-raised/15',
          !isLast && 'border-b border-dashed border-border',
          isLast && !isExpanded && 'border-b border-border',
        )}
      >
        {/* Contract number + location */}
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-text-main font-mono leading-tight">
            {client.contractNumber || `SIN-CONTRATO`}
          </p>
          {client.address && (
            <p className="text-[11px] text-text-muted mt-0.5 truncate flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {client.address}{client.city ? `, ${client.city}` : ''}
            </p>
          )}
          {!client.address && (
            <p className="text-[11px] text-text-muted/50 mt-0.5">{client.plan}</p>
          )}
        </div>

        {/* Service type */}
        <div><ServiceTag type={serviceType} /></div>

        {/* Status */}
        <div><StatusPill status={client.status} /></div>

        {/* Payment */}
        <div><PaymentPill dueDate={client.paymentDueDate} /></div>

        {/* Amount */}
        <div>
          <p className="text-sm font-bold text-text-main tabular-nums">
            ${client.amount.toLocaleString('es-CO')}
          </p>
          <p className="text-[10px] text-text-muted">/ mes</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {canSuspend && (
            <ActionButton isActive={isActive} loading={actionLoading} onClick={onToggleStatus} />
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            onClick={e => { e.stopPropagation(); onToggle(); }}
            className="p-1 ml-0.5 rounded-md hover:bg-black/[0.05] text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>

      {/* Contract detail panel (level 3) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={cn(
              'overflow-hidden bg-surface-raised/10 border-l-2 border-l-primary border-b border-border',
            )}
          >
            <div className="pl-14 pr-6 py-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
              <DetailField icon={CreditCard}
                label={docLabel}
                value={client.documentId} />
              {client.phone     && <DetailField icon={Phone}    label="Teléfono"        value={client.phone} />}
              {client.email     && <DetailField icon={Mail}     label="Email"           value={client.email} />}
              {client.address   && (
                <DetailField icon={MapPin}   label="Dirección"
                  value={`${client.address}${client.city ? `, ${client.city}` : ''}`} />
              )}
              {client.installationDate && (
                <DetailField icon={Calendar} label="Instalación"
                  value={formatDate(new Date(client.installationDate), 'd MMM yyyy', { locale: es })} />
              )}
              {client.lastConnection && (
                <DetailField icon={Clock}    label="Última conexión"
                  value={formatDate(new Date(client.lastConnection), 'd MMM yyyy, HH:mm', { locale: es })} />
              )}
              {client.latency   !== undefined && <DetailField icon={Gauge}    label="Latencia"  value={`${client.latency} ms`} />}
              {client.uptime    !== undefined && <DetailField icon={Activity} label="Uptime"    value={`${client.uptime.toFixed(1)}%`} />}
              {client.bandwidthUsage !== undefined && (
                <DetailField icon={Wifi} label="Uso de banda" value={`${client.bandwidthUsage.toFixed(1)} GB`} />
              )}
              {client.plan && <DetailField icon={FileText} label="Plan" value={`${client.plan} · ${client.planSpeed} Mbps`} />}
            </div>

            {client.notes && (
              <div className="pl-14 pr-6 pb-3">
                <p className="text-xs text-text-muted italic border-l-2 border-border pl-3">{client.notes}</p>
              </div>
            )}

            <div className="pl-14 pr-6 py-3 border-t border-border flex items-center gap-3 flex-wrap">
              <button
                onClick={e => { e.stopPropagation(); onViewHistory(); }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ver mensajes
              </button>
              <span className="w-px h-3.5 bg-border" />
              <button
                onClick={e => { e.stopPropagation(); navigate('/support'); }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors"
              >
                <Ticket className="w-3.5 h-3.5" />
                Crear ticket
              </button>
              {client.phone && (
                <>
                  <span className="w-px h-3.5 bg-border" />
                  <a
                    href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                    target="_blank" rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-[#25d366] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Person row (level 1) ────────────────────────────────────── */
const PersonRow = ({
  name, documentId, services, index,
  expandedContracts, onToggleContract,
  actionLoading, canSuspend, onToggleStatus, onViewHistory,
}: {
  name: string; documentId: string; services: Client[]; index: number;
  expandedContracts: Set<string>; onToggleContract: (id: string) => void;
  actionLoading: string | null; canSuspend: boolean;
  onToggleStatus: (id: string) => void; onViewHistory: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const multi = services.length > 1;

  return (
    <div className="border-b border-border">
      {/* Person header */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: index * 0.05 }}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none',
          'hover:bg-surface-raised/30 transition-colors duration-100',
          open && 'bg-surface-raised/20',
        )}
      >
        <Avatar name={name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-main leading-snug truncate">{name}</p>
          <p className="text-[11px] text-text-muted mt-0.5 font-mono">
            {documentId}
            {multi && (
              <span className="ml-2 text-[10px] font-semibold text-primary/70 bg-primary/[0.08] border border-primary/15 px-1.5 py-0.5 rounded-full">
                {services.length} servicios
              </span>
            )}
          </p>
        </div>

        {/* Right side: if single service, show pills inline; always show chevron */}
        {!multi && (
          <div className="hidden lg:flex items-center gap-3 mr-2">
            <StatusPill status={services[0].status} />
            <PaymentPill dueDate={services[0].paymentDueDate} />
            <p className="text-sm font-bold tabular-nums text-text-main w-[106px] text-right">
              ${services[0].amount.toLocaleString('es-CO')}
              <span className="text-[10px] font-normal text-text-muted"> /mes</span>
            </p>
          </div>
        )}

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="p-1 rounded-md hover:bg-black/[0.05] text-text-muted transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* Contract rows */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-dashed border-border"
          >
            {services.map((svc, si) => (
              <ContractRow
                key={svc.id}
                client={svc}
                isExpanded={expandedContracts.has(svc.id)}
                onToggle={() => onToggleContract(svc.id)}
                onToggleStatus={() => onToggleStatus(svc.id)}
                actionLoading={actionLoading === svc.id}
                canSuspend={canSuspend}
                onViewHistory={() => onViewHistory(svc.id)}
                isLast={si === services.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Clients Page ────────────────────────────────────────────── */
export const ClientsPage = () => {
  const { user } = useAuth();
  const [clients,           setClients]           = useState<Client[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [actionLoading,     setActionLoading]     = useState<string | null>(null);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [searchQuery,       setSearchQuery]       = useState('');
  const [statusFilter,      setStatusFilter]      = useState<'all' | Client['status']>('all');
  const [historyClientId,   setHistoryClientId]   = useState<string | null>(null);
  const [syncing,           setSyncing]           = useState(false);
  const [lastSynced,        setLastSynced]        = useState<Date | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const canSuspend = hasPermission(user?.role, 'suspend_clients');
  const canExport  = hasPermission(user?.role, 'export_data');

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await apiGetClients() as any[];
      setClients(data.map(mapClient));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setActionLoading(id);
      await apiToggleClientStatus(id);
      await loadClients();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await apiMikrotikSync();
      setLastSynced(new Date());
      toast.success(res.message);
      await loadClients();
    } catch (err: any) {
      toast.error(err.message ?? 'Error conectando a MikroTik');
    } finally {
      setSyncing(false);
    }
  };

  const toggleContract = (id: string) => {
    setExpandedContracts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const cycleSort = (key: SortKey) => {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  /* Filtered list */
  const filteredClients = useMemo(() => {
    let list = clients.filter(c => {
      const q = searchQuery.toLowerCase();
      return (
        (c.name.toLowerCase().includes(q) || c.documentId.includes(q) ||
          c.plan.toLowerCase().includes(q) || (c.contractNumber ?? '').toLowerCase().includes(q)) &&
        (statusFilter === 'all' || c.status === statusFilter)
      );
    });
    if (sort) {
      list = [...list].sort((a, b) => {
        const cmp = sort.key === 'name' ? a.name.localeCompare(b.name, 'es') : a.amount - b.amount;
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [clients, searchQuery, statusFilter, sort]);

  /* Group by documentId → each group = one person with N services */
  const personGroups = useMemo(() => {
    const map = new Map<string, Client[]>();
    filteredClients.forEach(c => {
      const arr = map.get(c.documentId) ?? [];
      arr.push(c);
      map.set(c.documentId, arr);
    });
    return Array.from(map.values());
  }, [filteredClients]);

  const historyClient  = useMemo(() => clients.find(c => c.id === historyClientId) ?? null, [clients, historyClientId]);
  const activeCount    = clients.filter(c => c.status === 'active').length;
  const suspendedCount = clients.filter(c => c.status === 'suspended').length;
  const personCount    = useMemo(() => new Set(clients.map(c => c.documentId)).size, [clients]);

  const filters = [
    { key: 'all' as const,       label: 'Todos' },
    { key: 'active' as const,    label: 'Activos' },
    { key: 'suspended' as const, label: 'Suspendidos' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Clientes</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {loading ? 'Cargando...' : `${personCount} persona${personCount !== 1 ? 's' : ''} · ${clients.length} servicio${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {lastSynced
              ? <p className="text-[11px] text-text-muted font-mono whitespace-nowrap">Última sync {formatDistanceToNow(lastSynced, { addSuffix: true, locale: es })}</p>
              : <p className="text-[11px] text-text-muted/50 whitespace-nowrap">Sin sincronizar</p>
            }
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-sm font-medium text-text-main transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-text-muted', syncing && 'animate-spin')} />
              {syncing ? 'Sincronizando...' : 'Sync MikroTik'}
            </motion.button>
          </div>

          {canExport && !loading && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => exportData('clients').catch(console.error)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-sm font-medium text-text-main transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              Exportar
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="flex gap-4">
          <Skeleton className="flex-1 h-24 rounded-xl" />
          <Skeleton className="flex-1 h-24 rounded-xl" />
          <Skeleton className="flex-1 h-24 rounded-xl" />
        </div>
      ) : (
        <div className="flex gap-4">
          <StatCard icon={Users}     label="Personas"    value={personCount}    color="text-text-main" delay={0}
            sub={`${clients.length} servicio${clients.length !== 1 ? 's' : ''} en total`} />
          <StatCard icon={UserCheck} label="Activos"     value={activeCount}    color="text-success"   delay={0.06}
            sub={clients.length ? `${Math.round(activeCount / clients.length * 100)}% del total` : undefined} />
          <StatCard icon={UserX}     label="Suspendidos" value={suspendedCount} color="text-danger"    delay={0.12}
            sub={suspendedCount > 0 ? `${suspendedCount} por reconectar` : 'Sin suspensiones'} />
        </div>
      )}

      {/* ── Search + filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Nombre, cédula, contrato o plan..."
            className="pl-9 w-64 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {filters.map(f => (
            <motion.button key={f.key} whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'text-[12px] px-3.5 py-1.5 rounded-full font-semibold transition-all border',
                statusFilter === f.key
                  ? 'bg-primary/[0.08] text-primary border-primary/20'
                  : 'bg-transparent text-text-muted hover:text-text-main hover:bg-black/[0.04] border-border'
              )}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
        {sort && (
          <button onClick={() => setSort(null)} className="text-[11px] text-text-muted hover:text-text-main transition-colors ml-auto">
            Quitar orden ×
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden"
        style={{ boxShadow: 'rgba(0,0,0,0.03) 0px 2px 12px' }}>

        {/* Column headers — align with CONTRACT_COLS + person indent */}
        <div className={cn(CONTRACT_COLS, 'gap-4 pl-14 pr-5 py-2.5 border-b border-border bg-surface-raised/30')}>
          <SortHeader label="Contrato / Dirección" sortKey="name"   active={sort?.key === 'name'}   dir={sort?.dir ?? 'asc'} onClick={() => cycleSort('name')} />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Servicio</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Estado</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Pago</span>
          <SortHeader label="Monto"    sortKey="amount" active={sort?.key === 'amount'} dir={sort?.dir ?? 'asc'} onClick={() => cycleSort('amount')} />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Acciones</span>
        </div>

        {loading ? (
          <>
            <SkeletonRow delay={0} />
            <SkeletonRow delay={0.06} />
            <SkeletonRow delay={0.12} />
          </>
        ) : filteredClients.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center mx-auto mb-3">
              <Search className="w-4 h-4 text-text-muted/40" />
            </div>
            <p className="text-sm font-medium text-text-muted">Sin resultados</p>
            <p className="text-xs text-text-muted/50 mt-0.5">Intenta otro término de búsqueda</p>
          </motion.div>
        ) : (
          personGroups.map((services, i) => (
            <PersonRow
              key={services[0].documentId}
              name={services[0].name}
              documentId={services[0].documentId}
              services={services}
              index={i}
              expandedContracts={expandedContracts}
              onToggleContract={toggleContract}
              actionLoading={actionLoading}
              canSuspend={canSuspend}
              onToggleStatus={handleToggleStatus}
              onViewHistory={id => setHistoryClientId(id)}
            />
          ))
        )}

        {!loading && filteredClients.length > 0 && (
          <div className="px-5 py-2.5 bg-surface-raised/15 border-t border-border flex items-center justify-between">
            <p className="text-[11px] text-text-muted font-mono">
              {personCount} persona{personCount !== 1 ? 's' : ''} · {filteredClients.length} servicio{filteredClients.length !== 1 ? 's' : ''}
            </p>
            {personGroups.filter(g => g.length > 1).length > 0 && (
              <p className="text-[11px] text-text-muted">
                {personGroups.filter(g => g.length > 1).length} con múltiples servicios
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── History panel ── */}
      {historyClientId && historyClient && (
        <ClientHistoryPanel
          clientId={historyClientId}
          clientName={historyClient.name}
          onClose={() => setHistoryClientId(null)}
        />
      )}
    </motion.div>
  );
};
