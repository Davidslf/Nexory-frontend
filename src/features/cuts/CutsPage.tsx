import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors, CalendarX, CheckCircle2, AlertTriangle,
  Clock, RefreshCw, User, XCircle,
} from 'lucide-react';
import { apiGetCuts, apiExecuteCut, apiRestoreCut } from '@/services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Pagination } from '@/components/ui/Pagination';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

/* ─── Types ──────────────────────────────────────────────────────── */
interface Cut {
  id: string;
  clientId: string;
  reason: string;
  scheduledAt: string;
  executedAt: string | null;
  restoredAt: string | null;
  status: 'SCHEDULED' | 'EXECUTED' | 'RESTORED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  client: { id: string; name: string; plan: string } | null;
  _isDemo?: boolean;
}

/* ─── Demo data ──────────────────────────────────────────────────── */
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const DEMO_CUTS: Cut[] = [
  {
    id: 'demo-cut-1',
    clientId: 'demo',
    reason: 'Falta de pago — mes de abril 2026',
    scheduledAt: d(1),
    executedAt: null,
    restoredAt: null,
    status: 'SCHEDULED',
    notes: null,
    createdAt: d(2),
    client: { id: 'demo', name: 'Roberto Cárdenas Vega', plan: 'Fibra 50 Mbps' },
    _isDemo: true,
  },
  {
    id: 'demo-cut-2',
    clientId: 'demo',
    reason: 'Deuda acumulada 2 meses (marzo–abril)',
    scheduledAt: d(10),
    executedAt: d(9),
    restoredAt: null,
    status: 'EXECUTED',
    notes: 'Cliente notificado por WhatsApp. Sin respuesta.',
    createdAt: d(11),
    client: { id: 'demo', name: 'Lorena Jiménez Parra', plan: 'Fibra 30 Mbps' },
    _isDemo: true,
  },
  {
    id: 'demo-cut-3',
    clientId: 'demo',
    reason: 'Pago no registrado — marzo 2026',
    scheduledAt: d(18),
    executedAt: d(17),
    restoredAt: d(15),
    status: 'RESTORED',
    notes: 'Pago recibido en efectivo. Servicio restablecido.',
    createdAt: d(19),
    client: { id: 'demo', name: 'Felipe Morales Ruiz', plan: 'Fibra 100 Mbps' },
    _isDemo: true,
  },
];

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS_MAP = {
  SCHEDULED: { cls: 'text-warning border-warning/25 bg-warning/[0.07]', label: 'Programado', icon: Clock        },
  EXECUTED:  { cls: 'text-danger  border-danger/25  bg-danger/[0.07]',  label: 'Ejecutado',  icon: CalendarX    },
  RESTORED:  { cls: 'text-success border-success/25 bg-success/[0.07]', label: 'Restaurado', icon: CheckCircle2 },
  CANCELLED: { cls: 'text-text-muted border-border  bg-surface-raised', label: 'Cancelado',  icon: XCircle      },
} as const;

const CutStatusBadge = ({ status }: { status: Cut['status'] }) => {
  const { cls, label, icon: Icon } = STATUS_MAP[status] ?? STATUS_MAP.SCHEDULED;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', cls)}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {label}
    </span>
  );
};

/* ─── Cuts Page ──────────────────────────────────────────────────── */
type StatusFilter = 'all' | Cut['status'];
const PAGE_SIZE = 10;

export const CutsPage = () => {
  const { user } = useAuth();
  const [realCuts,  setRealCuts]  = useState<Cut[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [actionId,  setActionId]  = useState<string | null>(null);
  const [filter,    setFilter]    = useState<StatusFilter>('all');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);

  const canManage = hasPermission(user?.role, 'manage_support');
  const cuts = useMemo(() => [...realCuts, ...DEMO_CUTS], [realCuts]);

  useEffect(() => { loadCuts(); }, []);

  const loadCuts = async () => {
    setLoading(true);
    try {
      const data = await apiGetCuts() as Cut[];
      setRealCuts(data);
    } catch { /* backend no disponible */ }
    finally { setLoading(false); }
  };

  const handleExecute = async (id: string) => {
    if (!confirm('¿Ejecutar este corte? El cliente quedará suspendido.')) return;
    setActionId(id);
    try { await apiExecuteCut(id); await loadCuts(); }
    catch { alert('Error al ejecutar corte'); }
    finally { setActionId(null); }
  };

  const handleRestore = async (id: string) => {
    setActionId(id);
    try { await apiRestoreCut(id); await loadCuts(); }
    catch { alert('Error al restaurar'); }
    finally { setActionId(null); }
  };

  const stats = useMemo(() => ({
    scheduled: realCuts.filter(c => c.status === 'SCHEDULED').length,
    executed:  realCuts.filter(c => c.status === 'EXECUTED').length,
    restored:  realCuts.filter(c => c.status === 'RESTORED').length,
  }), [realCuts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cuts.filter(c => {
      const matchS = filter === 'all' || c.status === filter;
      const matchQ = !q ||
        (c.client?.name ?? '').toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q) ||
        (c.client?.plan ?? '').toLowerCase().includes(q);
      return matchS && matchQ;
    });
  }, [cuts, filter, search]);

  // Reset to page 1 when filters change
  useMemo(() => setPage(1), [filter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const segments = [
    { value: 'all' as StatusFilter,       label: 'Todos',       count: cuts.length },
    { value: 'SCHEDULED' as StatusFilter, label: 'Programados', count: cuts.filter(c => c.status === 'SCHEDULED').length, icon: Clock        },
    { value: 'EXECUTED'  as StatusFilter, label: 'Ejecutados',  count: cuts.filter(c => c.status === 'EXECUTED').length,  icon: CalendarX    },
    { value: 'RESTORED'  as StatusFilter, label: 'Restaurados', count: cuts.filter(c => c.status === 'RESTORED').length,  icon: CheckCircle2 },
    { value: 'CANCELLED' as StatusFilter, label: 'Cancelados',  count: cuts.filter(c => c.status === 'CANCELLED').length, icon: XCircle      },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Cortes de Servicio</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {stats.scheduled} programado{stats.scheduled !== 1 ? 's' : ''} · {stats.executed} ejecutado{stats.executed !== 1 ? 's' : ''}
          </p>
        </div>
        <Tooltip content="Sincronizar con el servidor">
          <button
            onClick={loadCuts}
            disabled={loading}
            className="btn-action btn-action-ghost px-3 py-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Actualizar
          </button>
        </Tooltip>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 border border-border rounded-xl bg-surface overflow-hidden"
        style={{ boxShadow: 'rgba(0,0,0,0.03) 0px 2px 12px' }}>
        {[
          { label: 'Programados', value: stats.scheduled, color: 'var(--color-warning)', trend: 'pendientes de ejecutar' },
          { label: 'Ejecutados',  value: stats.executed,  color: 'var(--color-danger)',  trend: 'clientes suspendidos'  },
          { label: 'Restaurados', value: stats.restored,  color: 'var(--color-success)', trend: 'servicio restablecido' },
        ].map((s, i) => (
          <div key={s.label} className={cn('stat-block', i < 2 && 'border-r border-border')}>
            <span className="stat-block-label">{s.label.toUpperCase()}</span>
            <span className="stat-block-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-block-trend">{s.trend}</span>
          </div>
        ))}
      </div>

      {/* Filters toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Buscar cliente o razón..."
          className="w-56"
        />
        <SegmentControl
          segments={segments}
          value={filter}
          onChange={v => { setFilter(v); setPage(1); }}
          size="sm"
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden"
        style={{ boxShadow: 'rgba(0,0,0,0.03) 0px 2px 12px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <RefreshCw className="w-4 h-4 text-text-subtle animate-spin" />
            <span className="text-sm text-text-muted font-mono">cargando cortes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Scissors className="w-10 h-10 mx-auto mb-3 text-text-subtle" />
            <p className="text-sm text-text-muted font-medium">Sin cortes</p>
            <p className="text-xs text-text-subtle mt-1">
              {search ? 'Intenta con otros términos de búsqueda' : 'Los cortes se crean cuando un cliente no paga'}
            </p>
          </div>
        ) : (
          <>
            <table className="line-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Razón</th>
                  <th>Estado</th>
                  <th>Programado</th>
                  <th>Ejecutado</th>
                  {canManage && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map(cut => (
                  <motion.tr
                    key={cut.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* Cliente */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-text-muted" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-text-main leading-tight truncate">
                              {cut.client?.name ?? cut.clientId}
                            </p>
                            {cut._isDemo && (
                              <span className="flex-shrink-0 text-[9px] font-bold px-1 py-px rounded bg-surface-raised border border-border text-text-subtle uppercase tracking-wide">Demo</span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5">{cut.client?.plan ?? '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Razón */}
                    <td className="max-w-[200px]">
                      <Tooltip content={cut.reason} side="top">
                        <span className="text-xs text-text-muted truncate block cursor-default">{cut.reason || '—'}</span>
                      </Tooltip>
                      {cut.notes && (
                        <p className="text-[10px] text-text-subtle mt-0.5 truncate">{cut.notes}</p>
                      )}
                    </td>

                    {/* Estado */}
                    <td><CutStatusBadge status={cut.status} /></td>

                    {/* Programado */}
                    <td className="whitespace-nowrap">
                      <p className="text-[11px] font-mono text-text-main">
                        {format(new Date(cut.scheduledAt), 'd MMM yyyy', { locale: es })}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono">
                        {format(new Date(cut.scheduledAt), 'HH:mm', { locale: es })}
                      </p>
                    </td>

                    {/* Ejecutado */}
                    <td className="whitespace-nowrap">
                      {cut.executedAt ? (
                        <>
                          <p className="text-[11px] font-mono text-text-main">
                            {format(new Date(cut.executedAt), 'd MMM yyyy', { locale: es })}
                          </p>
                          <p className="text-[10px] text-text-muted font-mono">
                            {format(new Date(cut.executedAt), 'HH:mm', { locale: es })}
                          </p>
                        </>
                      ) : (
                        <span className="text-text-muted/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    {canManage && (
                      <td>
                        <div className="flex items-center gap-1.5">
                          {cut.status === 'SCHEDULED' && !cut._isDemo && (
                            <Tooltip content="Cortar el servicio del cliente ahora" side="left">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleExecute(cut.id)}
                                disabled={actionId === cut.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-danger border-danger/20 bg-danger/[0.05] hover:bg-danger/[0.12] transition-colors disabled:opacity-50"
                              >
                                {actionId === cut.id
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <CalendarX className="w-3 h-3" />}
                                Ejecutar
                              </motion.button>
                            </Tooltip>
                          )}
                          {cut.status === 'EXECUTED' && !cut._isDemo && (
                            <Tooltip content="Restaurar el servicio del cliente" side="left">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRestore(cut.id)}
                                disabled={actionId === cut.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-success border-success/20 bg-success/[0.05] hover:bg-success/[0.12] transition-colors disabled:opacity-50"
                              >
                                {actionId === cut.id
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <CheckCircle2 className="w-3 h-3" />}
                                Restaurar
                              </motion.button>
                            </Tooltip>
                          )}
                          {cut._isDemo && (
                            <span className="text-[10px] text-text-subtle italic">Demo</span>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Footer: pagination */}
            <div className="px-5 py-3 border-t border-border bg-surface-raised/15">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onChange={setPage}
              />
              {filtered.length <= PAGE_SIZE && (
                <p className="text-[11px] text-text-muted font-mono">
                  {filtered.filter(c => !c._isDemo).length} real{filtered.filter(c => !c._isDemo).length !== 1 ? 'es' : ''} · {DEMO_CUTS.length} demo
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
