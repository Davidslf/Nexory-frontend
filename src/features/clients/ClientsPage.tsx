import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, ChevronDown, ChevronUp, ArrowUpDown,
  CreditCard, MapPin, Phone, Mail,
  Calendar, FileText, Wifi, Gauge, Activity, Clock,
  Search, Users, UserCheck, UserX,
  CheckCircle2, AlertCircle, XCircle, Power, RefreshCw,
  Home, Building2, Briefcase, MessageSquare, Ticket,
  Plus, X, Router, Eye, EyeOff,
  Stethoscope, RotateCcw, Signal, SignalZero,
} from 'lucide-react';
import {
  apiGetClients, apiToggleClientStatus, apiMikrotikSync, apiCreateClient,
  apiDiagnoseClient, apiRestartClientSession,
  type DiagnoseResult,
} from '@/services/api';
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
    className="min-w-0 rounded-xl border border-border bg-surface p-3 sm:p-5"
    style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2px 7px' }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-1 sm:mb-3">{label}</p>
        <p className={cn('text-2xl sm:text-[2.2rem] font-bold leading-none tabular-nums', color)}>{value}</p>
        {sub && <p className="text-[10px] sm:text-[11px] text-text-muted mt-1 sm:mt-2">{sub}</p>}
      </div>
      <div className={cn('p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-border bg-surface-raised hidden sm:flex', color)}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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

/* ─── Diagnostics panel ───────────────────────────────────────── */
const DiagnosticsPanel = ({ clientId, pppoeUsername }: { clientId: string; pppoeUsername?: string | null }) => {
  const [result,       setResult]       = useState<DiagnoseResult | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [restarting,   setRestarting]   = useState(false);

  const runDiagnose = async () => {
    try {
      setLoading(true);
      setResult(null);
      const res = await apiDiagnoseClient(clientId);
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, hasPppoe: !!pppoeUsername, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const restartSession = async () => {
    try {
      setRestarting(true);
      const res = await apiRestartClientSession(clientId);
      toast[res.success ? 'success' : 'error'](res.message);
      if (res.success) setTimeout(runDiagnose, 2000); // re-diagnose after 2s
    } catch (err: any) {
      toast.error(err.message ?? 'Error al reiniciar sesión');
    } finally {
      setRestarting(false);
    }
  };

  if (!pppoeUsername && !result) {
    return (
      <div className="px-4 py-3 rounded-lg bg-surface-raised/50 border border-border text-xs text-text-muted flex items-center gap-2">
        <Router className="w-3.5 h-3.5 flex-shrink-0" />
        Sin usuario PPPoE configurado — el diagnóstico MikroTik no está disponible para este cliente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Run button */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={runDiagnose}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-text-main transition-colors disabled:opacity-60"
        >
          {loading
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Diagnosticando...</>
            : <><Stethoscope className="w-3.5 h-3.5 text-primary" /> Ejecutar diagnóstico</>}
        </motion.button>
        {result?.data?.online && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={restartSession}
            disabled={restarting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warning/20 bg-warning/[0.05] hover:bg-warning/[0.10] text-xs font-semibold text-warning transition-colors disabled:opacity-60"
          >
            {restarting
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Reiniciando...</>
              : <><RotateCcw className="w-3.5 h-3.5" /> Reiniciar sesión</>}
          </motion.button>
        )}
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {/* No PPPoE configured */}
          {!result.hasPppoe && (
            <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs text-text-muted">{result.message}</div>
          )}

          {/* Error */}
          {result.hasPppoe && !result.success && (
            <div className="p-3 rounded-lg bg-danger/[0.06] border border-danger/20 text-xs text-danger flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {result.error ?? 'Error conectando a MikroTik'}
            </div>
          )}

          {/* Success with data */}
          {result.success && result.data && (
            <>
              {/* Status bar */}
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold',
                result.data.online
                  ? 'bg-success/[0.07] border-success/20 text-success'
                  : 'bg-danger/[0.06] border-danger/20 text-danger',
              )}>
                {result.data.online ? <Signal className="w-3.5 h-3.5" /> : <SignalZero className="w-3.5 h-3.5" />}
                {result.data.online ? `En línea · ${result.data.assignedIp}` : 'Desconectado'}
                {result.data.online && result.data.uptime && (
                  <span className="ml-auto font-normal text-text-muted">Conectado hace {result.data.uptime}</span>
                )}
              </div>

              {/* Checks */}
              <div className="space-y-1.5">
                {result.data.checks.map((c, i) => (
                  <div key={i} className={cn(
                    'flex items-start gap-2 px-3 py-2 rounded-lg border text-xs',
                    c.ok ? 'bg-success/[0.04] border-success/15' : 'bg-danger/[0.04] border-danger/15',
                  )}>
                    {c.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-3.5 h-3.5 text-danger flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className={cn('font-semibold', c.ok ? 'text-success' : 'text-danger')}>{c.label}</p>
                      <p className="text-text-muted mt-0.5">{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* PPPoE info row */}
              <div className="flex flex-wrap gap-3 px-1 text-[11px] text-text-muted">
                <span>Usuario PPPoE: <span className="font-mono text-text-main">{result.pppoeUsername}</span></span>
                <span>Perfil: <span className="font-mono text-text-main">{result.data.secretProfile}</span></span>
                {result.data.online && (
                  <span className="ml-auto">
                    ↓ {result.data.bytesIn} &nbsp; ↑ {result.data.bytesOut}
                  </span>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

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
              {client.latency        != null && <DetailField icon={Gauge}    label="Latencia"  value={`${client.latency} ms`} />}
              {client.uptime         != null && <DetailField icon={Activity} label="Uptime"    value={`${(client.uptime as number).toFixed(1)}%`} />}
              {client.bandwidthUsage != null && (
                <DetailField icon={Wifi} label="Uso de banda" value={`${(client.bandwidthUsage as number).toFixed(1)} GB`} />
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

            {/* ── Diagnostics ── */}
            <div className="pl-14 pr-6 py-4 border-t border-dashed border-border">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Router className="w-3 h-3" /> Diagnóstico MikroTik
              </p>
              <DiagnosticsPanel clientId={client.id} pppoeUsername={(client as any).pppoeUsername} />
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

/* ─── Catálogo de planes ──────────────────────────────────────── */
const PLAN_CATALOG = [
  { label: 'Básico · 10 Mbps · $45.000',         name: 'Plan Básico',        speed: 10,  fee: 45000,  profile: 'plan-10mb'  },
  { label: 'Hogar · 30 Mbps · $65.000',          name: 'Plan Hogar 30MB',    speed: 30,  fee: 65000,  profile: 'plan-30mb'  },
  { label: 'Hogar · 50 Mbps · $85.000',          name: 'Plan Hogar 50MB',    speed: 50,  fee: 85000,  profile: 'plan-50mb'  },
  { label: 'Negocio · 100 Mbps · $120.000',      name: 'Plan Negocio 100',   speed: 100, fee: 120000, profile: 'plan-100mb' },
  { label: 'Negocio · 200 Mbps · $200.000',      name: 'Plan Negocio 200',   speed: 200, fee: 200000, profile: 'plan-200mb' },
  { label: 'Empresarial · 500 Mbps · $350.000',  name: 'Plan Empresarial',   speed: 500, fee: 350000, profile: 'plan-500mb' },
] as const;

const CITIES_CO = [
  'Medellín','Bogotá','Cali','Barranquilla','Cartagena','Bucaramanga',
  'Pereira','Manizales','Cúcuta','Ibagué','Santa Marta','Villavicencio',
  'Pasto','Montería','Valledupar','Armenia','Sincelejo','Popayán','Otra ciudad',
];

const SERVICE_TYPES = [
  { value: 'hogar',   label: '🏠 Hogar / Residencial' },
  { value: 'negocio', label: '🏢 Negocio / Comercial'  },
  { value: 'empresa', label: '🏗️ Empresa / Corporativo' },
] as const;

const DUE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1); // 1–28

/* ─── Helpers de formulario ───────────────────────────────────── */
const genPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
// Max 8 dígitos → "cli-12345678" (12 chars, cómodo para MikroTik)
const toUsername = (doc: string) => `cli-${doc.replace(/\D/g, '').slice(0, 8)}`;

const CONTRACT_PREFIX: Record<'hogar' | 'negocio' | 'empresa', string> = {
  hogar:   'CON-HOG',
  negocio: 'CON-NEG',
  empresa: 'CON-EMP',
};
const genContractNumber = (serviceType: 'hogar' | 'negocio' | 'empresa', count: number) =>
  `${CONTRACT_PREFIX[serviceType]}-${String(count + 1).padStart(3, '0')}`;

/* ─── Form initial state ──────────────────────────────────────── */
const FORM_INIT = {
  // Cliente
  name:             '',
  documentId:       '',
  phone:            '',
  email:            '',
  serviceType:      'hogar' as 'hogar' | 'negocio' | 'empresa',
  city:             '',
  address:          '',
  // Plan
  planName:         '',
  planSpeed:        0,
  monthlyFee:       0,
  routerProfile:    '',
  paymentDueDay:    '5',
  status:           'ACTIVE',
  installationDate: '',
  contractNumber:   '',
  notes:            '',
  // MikroTik
  createMikrotik:   true,
  pppoeUsername:    '',
  pppoePassword:    '',
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
  const [sort,              setSort]              = useState<{ key: SortKey; dir: SortDir } | null>(null);
  const [showCreateModal,   setShowCreateModal]   = useState(false);
  const [creating,          setCreating]          = useState(false);
  const [showPppoePass,     setShowPppoePass]     = useState(false);
  const [form,              setForm]              = useState({ ...FORM_INIT });
  const [activeTab,         setActiveTab]         = useState<'client' | 'plan'>('client');
  const [createdCreds,      setCreatedCreds]      = useState<{ user: string; pass: string } | null>(null);
  const [userEditedUsername, setUserEditedUsername] = useState(false);

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

  const openCreateModal = () => {
    setForm({
      ...FORM_INIT,
      pppoePassword:  genPassword(),
      contractNumber: genContractNumber('hogar', clients.length),
    });
    setActiveTab('client');
    setShowPppoePass(false);
    setCreatedCreds(null);
    setUserEditedUsername(false);
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validación manual — sin depender del `required` nativo del browser
    if (!form.documentId.trim()) {
      toast.error('La cédula / NIT es obligatoria');
      setActiveTab('client');
      return;
    }
    if (!form.name.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      setActiveTab('client');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('El número de WhatsApp es obligatorio');
      setActiveTab('client');
      return;
    }
    if (!form.planName) {
      toast.error('Seleccioná un plan de servicio');
      setActiveTab('plan');
      return;
    }
    try {
      setCreating(true);
      const body: Record<string, unknown> = {
        name:           form.name.trim(),
        documentId:     form.documentId.trim(),
        phone:          form.phone.trim(),
        plan:           form.planName,
        planSpeed:      form.planSpeed,
        monthlyFee:     form.monthlyFee,
        status:         form.status,
        paymentDueDay:  Number(form.paymentDueDay) || 5,
        tags:           [form.serviceType],
        ...(form.email            ? { email:            form.email.trim() }   : {}),
        ...(form.city             ? { city:             form.city }           : {}),
        ...(form.address          ? { address:          form.address.trim() } : {}),
        ...(form.contractNumber   ? { contractNumber:   form.contractNumber.trim() } : {}),
        ...(form.notes            ? { notes:            form.notes.trim() }   : {}),
        ...(form.installationDate ? { installationDate: new Date(form.installationDate).toISOString() } : {}),
        // MikroTik
        createMikrotik: form.createMikrotik,
        ...(form.createMikrotik ? {
          pppoeUsername: form.pppoeUsername || toUsername(form.documentId),
          pppoePassword: form.pppoePassword || genPassword(),
          routerProfile: form.routerProfile || undefined,
        } : {}),
      };
      const res = await apiCreateClient(body) as any;
      await loadClients();

      if (res?.mikrotikStatus === 'created') {
        // Mostrar credenciales generadas
        setCreatedCreds({
          user: res.pppoeUsernameAssigned ?? form.pppoeUsername,
          pass: res.generatedPassword ?? form.pppoePassword,
        });
      } else {
        if (res?.mikrotikWarning) toast.warning(`MikroTik: ${res.mikrotikWarning}`);
        toast.success('Cliente creado correctamente');
        setShowCreateModal(false);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Error creando cliente');
    } finally {
      setCreating(false);
    }
  };

  const setField = (key: keyof typeof FORM_INIT) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setForm(f => {
        const next = { ...f, [key]: val };
        // Auto-update PPPoE username when documentId changes (unless user edited it manually)
        if (key === 'documentId' && !userEditedUsername) {
          next.pppoeUsername = toUsername(val);
        }
        // Auto-update contract number prefix when service type changes
        if (key === 'serviceType') {
          const st = val as 'hogar' | 'negocio' | 'empresa';
          next.contractNumber = genContractNumber(st, clients.length);
        }
        return next;
      });
    }
  );

  const selectPlan = (planName: string) => {
    const plan = PLAN_CATALOG.find(p => p.name === planName);
    if (!plan) return;
    setForm(f => ({
      ...f,
      planName:      plan.name,
      planSpeed:     plan.speed,
      monthlyFee:    plan.fee,
      routerProfile: plan.profile,
    }));
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Clientes</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {loading ? 'Cargando...' : `${personCount} persona${personCount !== 1 ? 's' : ''} · ${clients.length} servicio${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Cliente</span>
            <span className="sm:hidden">Nuevo</span>
          </motion.button>

          <div className="flex items-center gap-2">
            {lastSynced
              ? <p className="text-[11px] text-text-muted font-mono hidden sm:block whitespace-nowrap">Última sync {formatDistanceToNow(lastSynced, { addSuffix: true, locale: es })}</p>
              : <p className="text-[11px] text-text-muted/50 hidden sm:block whitespace-nowrap">Sin sincronizar</p>
            }
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-sm font-medium text-text-main transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-text-muted', syncing && 'animate-spin')} />
              <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : 'Sync MikroTik'}</span>
              <span className="sm:hidden">{syncing ? '...' : 'Sync'}</span>
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
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Skeleton className="h-20 sm:h-24 rounded-xl" />
          <Skeleton className="h-20 sm:h-24 rounded-xl" />
          <Skeleton className="h-20 sm:h-24 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <StatCard icon={Users}     label="Personas"    value={personCount}    color="text-text-main" delay={0}
            sub={`${clients.length} servicio${clients.length !== 1 ? 's' : ''} en total`} />
          <StatCard icon={UserCheck} label="Activos"     value={activeCount}    color="text-success"   delay={0.06}
            sub={clients.length ? `${Math.round(activeCount / clients.length * 100)}% del total` : undefined} />
          <StatCard icon={UserX}     label="Suspendidos" value={suspendedCount} color="text-danger"    delay={0.12}
            sub={suspendedCount > 0 ? `${suspendedCount} por reconectar` : 'Sin suspensiones'} />
        </div>
      )}

      {/* ── Search + filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Nombre, cédula, contrato o plan..."
            className="pl-9 w-full sm:w-64 text-sm"
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

        {/* Scrollable table area (header + rows) */}
        {(loading || filteredClients.length > 0) && (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Column headers */}
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
            </div>
          </div>
        )}

        {/* Empty state — full width, no min-w constraint */}
        {!loading && filteredClients.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center mx-auto mb-3">
              <Search className="w-4 h-4 text-text-muted/40" />
            </div>
            <p className="text-sm font-medium text-text-muted">Sin resultados</p>
            <p className="text-xs text-text-muted/50 mt-0.5">Intenta otro término de búsqueda</p>
          </motion.div>
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

      {/* ── Create Client Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget && !creating) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* ── ÉXITO: mostrar credenciales ── */}
              {createdCreds ? (
                <div className="p-8 text-center space-y-5">
                  <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-main">¡Cliente creado en Nexory y MikroTik!</h3>
                    <p className="text-sm text-text-muted mt-1">Guardá estas credenciales PPPoE para entregárselas al cliente</p>
                  </div>
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.04] p-5 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Usuario PPPoE</span>
                      <button onClick={() => { navigator.clipboard.writeText(createdCreds.user); toast.success('Copiado'); }}
                        className="text-[10px] text-primary hover:underline">Copiar</button>
                    </div>
                    <p className="font-mono text-base font-bold text-text-main bg-surface-raised px-3 py-2 rounded-lg">{createdCreds.user}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contraseña PPPoE</span>
                      <button onClick={() => { navigator.clipboard.writeText(createdCreds.pass); toast.success('Copiado'); }}
                        className="text-[10px] text-primary hover:underline">Copiar</button>
                    </div>
                    <p className="font-mono text-base font-bold text-text-main bg-surface-raised px-3 py-2 rounded-lg">{createdCreds.pass}</p>
                  </div>
                  <p className="text-[11px] text-text-muted/60">⚠ Esta contraseña no volverá a mostrarse en texto plano</p>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Entendido, cerrar
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                      <h2 className="text-base font-bold text-text-main">Nuevo Cliente</h2>
                      <p className="text-xs text-text-muted mt-0.5">Completa los datos para registrar el cliente</p>
                    </div>
                    <button onClick={() => setShowCreateModal(false)}
                      className="p-1.5 rounded-lg hover:bg-black/[0.06] text-text-muted transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-border bg-surface-raised/10">
                    {([
                      { key: 'client', label: '👤 Datos del cliente' },
                      { key: 'plan',   label: '📡 Plan y conexión' },
                    ] as const).map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          'flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors',
                          activeTab === tab.key
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-text-main',
                        )}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleCreate}>
                    <div className="overflow-y-auto px-6 py-5 space-y-4" style={{ maxHeight: 'calc(100vh - 16rem)' }}>

                      {/* ── Tab: Datos del cliente ── */}
                      {activeTab === 'client' && (
                        <div className="space-y-4">
                          {/* Cédula destacada */}
                          <div className="p-4 rounded-xl bg-primary/[0.04] border border-primary/15 space-y-1">
                            <label className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                              Cédula / NIT <span className="text-danger">*</span>
                            </label>
                            <Input
                              value={form.documentId}
                              onChange={setField('documentId')}
                              placeholder="Ej: 1020456789"
                              className="text-base font-mono font-bold"
                            />
                            <p className="text-[10px] text-text-muted">Este número identifica al cliente y genera su usuario PPPoE</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                              Nombre completo <span className="text-danger">*</span>
                            </label>
                            <Input value={form.name} onChange={setField('name')} placeholder="Ej: Carlos Andrés Martínez" />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                WhatsApp <span className="text-danger">*</span>
                              </label>
                              <Input value={form.phone} onChange={setField('phone')} placeholder="3001234567" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Email</label>
                              <Input type="email" value={form.email} onChange={setField('email')} placeholder="correo@email.com" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Tipo de cliente</label>
                            <select value={form.serviceType} onChange={setField('serviceType')}
                              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-primary/50">
                              {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Ciudad</label>
                              <select value={form.city} onChange={setField('city')}
                                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-primary/50">
                                <option value="">Seleccionar...</option>
                                {CITIES_CO.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Dirección</label>
                              <Input value={form.address} onChange={setField('address')} placeholder="Calle 12 # 5-43" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Tab: Plan y conexión ── */}
                      {activeTab === 'plan' && (
                        <div className="space-y-4">
                          {/* Plan selector */}
                          <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                              Plan de servicio <span className="text-danger">*</span>
                            </label>
                            <div className="space-y-1.5">
                              {PLAN_CATALOG.map(p => (
                                <button key={p.name} type="button" onClick={() => selectPlan(p.name)}
                                  className={cn(
                                    'w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all text-left',
                                    form.planName === p.name
                                      ? 'border-primary bg-primary/[0.07] text-primary font-semibold'
                                      : 'border-border hover:border-primary/30 hover:bg-surface-raised text-text-main',
                                  )}>
                                  <span>{p.speed} Mbps · {p.name.replace('Plan ', '')}</span>
                                  <span className={cn('font-mono text-xs', form.planName === p.name ? 'text-primary' : 'text-text-muted')}>
                                    ${p.fee.toLocaleString('es-CO')} /mes
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Día de cobro</label>
                              <select value={form.paymentDueDay} onChange={setField('paymentDueDay')}
                                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-primary/50">
                                {DUE_DAYS.map(d => <option key={d} value={d}>Día {d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Estado inicial</label>
                              <select value={form.status} onChange={setField('status')}
                                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-primary/50">
                                <option value="ACTIVE">✅ Activo</option>
                                <option value="PENDING">⏳ Pendiente</option>
                                <option value="SUSPENDED">🔴 Suspendido</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Fecha instalación</label>
                              <Input type="date" value={form.installationDate} onChange={setField('installationDate')} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">N° contrato</label>
                              <Input value={form.contractNumber} onChange={setField('contractNumber')} placeholder="CON-2025-001" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Notas internas</label>
                            <textarea value={form.notes} onChange={setField('notes')}
                              placeholder="Observaciones sobre la instalación..."
                              rows={2}
                              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                            />
                          </div>

                          {/* ── MikroTik toggle ── */}
                          <div className="rounded-xl border border-border bg-surface-raised/20 overflow-hidden">
                            <button type="button"
                              onClick={() => setForm(f => ({ ...f, createMikrotik: !f.createMikrotik }))}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised/30 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <Router className="w-4 h-4 text-primary" />
                                <div className="text-left">
                                  <p className="text-sm font-semibold text-text-main">Registrar en MikroTik</p>
                                  <p className="text-[11px] text-text-muted">Crea el usuario PPPoE automáticamente en el router</p>
                                </div>
                              </div>
                              <div className={cn(
                                'w-10 h-5 rounded-full transition-colors relative',
                                form.createMikrotik ? 'bg-primary' : 'bg-border',
                              )}>
                                <div className={cn(
                                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                  form.createMikrotik ? 'translate-x-5' : 'translate-x-0.5',
                                )} />
                              </div>
                            </button>

                            {form.createMikrotik && (
                              <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Usuario PPPoE</label>
                                    <Input
                                      value={form.pppoeUsername || toUsername(form.documentId)}
                                      onChange={e => { setUserEditedUsername(true); setForm(f => ({ ...f, pppoeUsername: e.target.value })); }}
                                      placeholder={toUsername(form.documentId || 'cedula')}
                                      className="font-mono text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Contraseña PPPoE</label>
                                    <div className="relative">
                                      <Input
                                        type={showPppoePass ? 'text' : 'password'}
                                        value={form.pppoePassword}
                                        onChange={setField('pppoePassword')}
                                        className="font-mono text-sm pr-16"
                                      />
                                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                                        <button type="button" onClick={() => setShowPppoePass(p => !p)}
                                          className="p-1 text-text-muted hover:text-text-main transition-colors">
                                          {showPppoePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                        <button type="button"
                                          onClick={() => setForm(f => ({ ...f, pppoePassword: genPassword() }))}
                                          title="Generar nueva contraseña"
                                          className="p-1 text-text-muted hover:text-primary transition-colors">
                                          <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                    Perfil MikroTik <span className="text-text-muted/50 font-normal">(auto-seleccionado por el plan)</span>
                                  </label>
                                  <Input value={form.routerProfile} onChange={setField('routerProfile')}
                                    placeholder={form.routerProfile || 'default'} className="font-mono text-sm" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-surface-raised/10">
                      <div className="flex gap-1.5">
                        {(['client', 'plan'] as const).map(t => (
                          <button key={t} type="button" onClick={() => setActiveTab(t)}
                            className={cn('w-2 h-2 rounded-full transition-colors',
                              activeTab === t ? 'bg-primary' : 'bg-border hover:bg-text-muted/40')} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowCreateModal(false)}
                          className="px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-raised transition-colors">
                          Cancelar
                        </button>
                        {activeTab === 'client' && (
                          <button type="button" onClick={() => setActiveTab('plan')}
                            className="px-3.5 py-2 rounded-lg border border-primary/20 bg-primary/[0.06] text-primary text-sm font-semibold hover:bg-primary/[0.12] transition-colors">
                            Siguiente →
                          </button>
                        )}
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={creating}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
                          {creating
                            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Creando...</>
                            : <><Plus className="w-3.5 h-3.5" /> Crear cliente</>}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
