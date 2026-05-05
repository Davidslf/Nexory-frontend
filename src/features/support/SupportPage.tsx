import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Phone, Wrench, AlertTriangle,
  CheckCircle2, Loader2, FileText,
  ChevronDown, ChevronUp, Search as SearchIcon,
  MessageSquare, Zap, Receipt, HelpCircle,
  PackageMinus, Settings, Gauge,
  Paperclip, Send, RotateCcw,
  TicketCheck, AlertCircle, Radio,
  User, Coffee, X, Archive, Inbox,
} from 'lucide-react';
import { apiGetTickets, apiUpdateTicket, apiAddTicketNote } from '@/services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { TicketCloseModal } from './TicketCloseModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────────── */
interface TicketNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}
interface Ticket {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: string;
  assignedTo: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string; phone: string; plan: string } | null;
  notes: TicketNote[];
  _isDemo?: boolean;
}

/* ─── Demo tickets ───────────────────────────────────────────────── */
const DEMO_TICKETS: Ticket[] = [
  {
    id: 'demo-1', clientId: 'demo',
    title: 'Instalación servicio hogar fibra óptica',
    description: 'Cliente nuevo solicita instalación de fibra óptica en su domicilio. Dirección verificada y programada para esta semana.',
    status: 'OPEN', priority: 'MEDIUM', type: 'instalacion',
    assignedTo: null, resolvedAt: null, resolution: null,
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    client: { id: 'demo', name: 'Carlos Martínez Ruiz', phone: '3012345678', plan: 'Fibra 50 Mbps' },
    notes: [], _isDemo: true,
  },
  {
    id: 'demo-2', clientId: 'demo',
    title: 'Retiro de equipo — cancelación de contrato',
    description: 'El cliente solicita la desinstalación del equipo por terminación voluntaria del contrato. Equipo en buen estado según cliente.',
    status: 'IN_PROGRESS', priority: 'LOW', type: 'desinstalacion',
    assignedTo: 'Técnico Luis', resolvedAt: null, resolution: null,
    createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
    client: { id: 'demo', name: 'Ana Sofía Gómez', phone: '3109876543', plan: 'Fibra 30 Mbps' },
    notes: [{
      id: 'note-demo-1',
      content: 'Me encuentro en el domicilio del cliente. Procedo con el retiro del ONT y router.',
      author: 'Técnico Luis',
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    }],
    _isDemo: true,
  },
];

/* ─── Ticket type config ─────────────────────────────────────────── */
const TICKET_TYPES: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  instalacion:    { label: 'Instalación',    icon: Wrench,        color: 'text-primary',    bg: 'bg-primary/[0.07]',    border: 'border-primary/20'   },
  desinstalacion: { label: 'Desinstalación', icon: PackageMinus,  color: 'text-text-muted', bg: 'bg-surface-raised',    border: 'border-border'       },
  falla_tecnica:  { label: 'Falla técnica',  icon: AlertTriangle, color: 'text-danger',     bg: 'bg-danger/[0.07]',     border: 'border-danger/20'    },
  mantenimiento:  { label: 'Mantenimiento',  icon: Settings,      color: 'text-warning',    bg: 'bg-warning/[0.07]',    border: 'border-warning/20'   },
  velocidad:      { label: 'Velocidad baja', icon: Gauge,         color: 'text-[#7c3aed]',  bg: 'bg-[#7c3aed]/[0.07]', border: 'border-[#7c3aed]/20' },
  facturacion:    { label: 'Facturación',    icon: Receipt,       color: 'text-success',    bg: 'bg-success/[0.07]',    border: 'border-success/20'   },
  otro:           { label: 'Otro',           icon: HelpCircle,    color: 'text-text-muted', bg: 'bg-surface-raised',    border: 'border-border'       },
};
const resolveType = (raw: string) => {
  const t = (raw ?? '').toLowerCase();
  if (t.includes('install'))                             return TICKET_TYPES.instalacion;
  if (t.includes('desinstall') || t.includes('retiro')) return TICKET_TYPES.desinstalacion;
  if (t.includes('fall') || t.includes('technical'))    return TICKET_TYPES.falla_tecnica;
  if (t.includes('mant'))                               return TICKET_TYPES.mantenimiento;
  if (t.includes('veloc') || t.includes('speed'))      return TICKET_TYPES.velocidad;
  if (t.includes('factur') || t.includes('pago'))      return TICKET_TYPES.facturacion;
  return TICKET_TYPES.otro;
};

/* ─── Quick replies ──────────────────────────────────────────────── */
const QUICK_REPLIES = [
  { emoji: '📍', text: 'Me encuentro en el domicilio del cliente.' },
  { emoji: '🔍', text: 'Se realiza revisión de equipos e infraestructura en sitio.' },
  { emoji: '📶', text: 'Señal verificada y estable. Se procede con la instalación.' },
  { emoji: '✅', text: 'Instalación completada correctamente. Equipo operativo.' },
  { emoji: '🔄', text: 'Se reinicia el equipo. Esperando reconexión en 2 minutos.' },
  { emoji: '⚠️', text: 'Se detecta problema en el cableado exterior. Requiere visita adicional.' },
  { emoji: '📞', text: 'Se intenta contactar al cliente sin respuesta. Se dejará aviso.' },
  { emoji: '📋', text: 'Desinstalación completada. Equipo retirado en buen estado.' },
  { emoji: '🚀', text: 'Servicio restaurado. Velocidad verificada dentro del plan contratado.' },
  { emoji: '🔧', text: 'Se reemplaza equipo dañado por uno nuevo. Configuración lista.' },
  { emoji: '🕐', text: 'Cliente ausente. Se agenda nueva visita técnica.' },
  { emoji: '📸', text: 'Evidencia fotográfica de la instalación adjuntada.' },
];

/* ─── Status / priority / type badges ───────────────────────────── */
const STATUS_CFG = {
  OPEN:        { label: 'Abierto',    dot: 'bg-text-muted', cls: 'text-text-muted border-border bg-surface-raised',     step: 0 },
  IN_PROGRESS: { label: 'En progreso',dot: 'bg-primary',    cls: 'text-primary border-primary/20 bg-primary/[0.07]',    step: 1 },
  WAITING:     { label: 'En espera',  dot: 'bg-warning',    cls: 'text-warning border-warning/20 bg-warning/[0.07]',    step: 1 },
  RESOLVED:    { label: 'Resuelto',   dot: 'bg-success',    cls: 'text-success border-success/20 bg-success/[0.07]',    step: 2 },
  CLOSED:      { label: 'Cerrado',    dot: 'bg-text-subtle',cls: 'text-text-subtle border-border bg-surface-raised',    step: 3 },
} as const;

const StatusBadge = ({ status }: { status: Ticket['status'] }) => {
  const cfg = STATUS_CFG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', cfg.cls)}>
      {status === 'WAITING'
        ? <Coffee className="w-3 h-3" />
        : <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />}
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: Ticket['priority'] }) => {
  if (priority === 'URGENT') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border text-danger border-danger/20 bg-danger/[0.07]">
      <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />Urgente
    </span>
  );
  if (priority === 'HIGH') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border text-warning border-warning/20 bg-warning/[0.07]">
      <span className="w-1.5 h-1.5 rounded-full bg-warning" />Alta
    </span>
  );
  if (priority === 'MEDIUM') return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border text-text-muted border-border bg-surface-raised">Media</span>
  );
  return <span className="text-[11px] text-text-muted/50">Baja</span>;
};

const TypeBadge = ({ type }: { type: string }) => {
  const cfg = resolveType(type);
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap', cfg.color, cfg.bg, cfg.border)}>
      <Icon className="w-3 h-3 flex-shrink-0" />{cfg.label}
    </span>
  );
};

const STEPS = ['Abierto', 'En curso', 'Resuelto'];
const ProgressSteps = ({ status }: { status: Ticket['status'] }) => {
  const step = STATUS_CFG[status]?.step ?? 0;
  const isWaiting = status === 'WAITING';
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full transition-colors',
            i < step ? 'bg-primary' : i === step ? (isWaiting ? 'bg-warning' : 'bg-primary') : 'bg-border'
          )} />
          {i < STEPS.length - 1 && (
            <div className={cn('w-4 h-px', i < step ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── Survey marker ──────────────────────────────────────────────── */
const SURVEY_MARKER = '[ENCUESTA_ENVIADA]';

/* ─── Note bubble ────────────────────────────────────────────────── */
const NoteBubble = ({ note, currentUser }: { note: TicketNote; currentUser: string }) => {
  const isSurvey = note.content.includes(SURVEY_MARKER);
  const isSystem = note.author === 'Sistema' || isSurvey;
  const isMine   = note.author === currentUser;
  const text = note.content.replace(SURVEY_MARKER, '').trim();
  const time = format(new Date(note.createdAt), 'd MMM, HH:mm', { locale: es });

  if (isSystem) return (
    <div className="flex justify-center my-2">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium bg-success/[0.08] border border-success/15 text-success">
        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
        {text}
        <span className="text-success/50 ml-1">{time}</span>
      </div>
    </div>
  );

  if (isMine) return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[75%]">
        <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
          {text}
        </div>
        <p className="text-[10px] text-text-muted/60 text-right mt-1">{time}</p>
      </div>
    </div>
  );

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[75%]">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-full bg-surface-raised border border-border flex items-center justify-center flex-shrink-0">
            <User className="w-2.5 h-2.5 text-text-muted" />
          </div>
          <p className="text-[10px] font-semibold text-text-muted">{note.author}</p>
        </div>
        <div className="bg-surface-raised border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-text-main leading-relaxed shadow-sm">
          {text}
        </div>
        <p className="text-[10px] text-text-muted/60 mt-1 pl-1">{time}</p>
      </div>
    </div>
  );
};

/* ─── Chat modal ─────────────────────────────────────────────────── */
const ChatModal = ({ ticket, currentUser, canManage, onReload, onClose }: {
  ticket: Ticket; currentUser: string; canManage: boolean;
  onReload: () => void; onClose: () => void;
}) => {
  const [text,       setText]       = useState('');
  const [saving,     setSaving]     = useState(false);
  const [showQR,     setShowQR]     = useState(false);
  const [localNotes, setLocalNotes] = useState<TicketNote[]>(ticket.notes);
  const endRef  = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const isDemo = !!ticket._isDemo;

  const typeCfg = resolveType(ticket.type);
  const TypeIcon = typeCfg.icon;

  const sortedNotes = useMemo(() =>
    [...localNotes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [localNotes],
  );

  // Sync notes when ticket prop updates (real reload)
  useEffect(() => { if (!isDemo) setLocalNotes(ticket.notes); }, [ticket.notes, isDemo]);

  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'auto' }), 80);
    setTimeout(() => textRef.current?.focus(), 150);
  }, []);

  const sendNote = async (content: string) => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (isDemo) {
        const fakeNote: TicketNote = {
          id: `demo-note-${Date.now()}`,
          content: content.trim(),
          author: currentUser,
          createdAt: new Date().toISOString(),
        };
        setLocalNotes(prev => [...prev, fakeNote]);
        setText('');
        setShowQR(false);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        await apiAddTicketNote(ticket.id, content.trim(), currentUser);
        setText('');
        setShowQR(false);
        await onReload();
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setText(prev => `${prev}[Adjunto: ${file.name}] `.trim());
      toast.success(`"${file.name}" adjuntado`);
    }
    e.target.value = '';
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-xl flex flex-col pointer-events-auto overflow-hidden"
          style={{ height: 'min(75vh, 620px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border flex-shrink-0 bg-surface-raised/30">
            <div className={cn('p-1.5 rounded-lg border flex-shrink-0', typeCfg.bg, typeCfg.border)}>
              <TypeIcon className={cn('w-3.5 h-3.5', typeCfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-main truncate">{ticket.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] text-text-muted truncate">{ticket.client?.name ?? '—'}</p>
                <span className="text-text-subtle">·</span>
                <StatusBadge status={ticket.status} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <MessageSquare className="w-3 h-3" />
                <span>{sortedNotes.length} nota{sortedNotes.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-raised border border-transparent hover:border-border transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick replies */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden border-b border-border bg-primary/[0.02] flex-shrink-0"
              >
                <div className="p-3 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                  {QUICK_REPLIES.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => { setText(qr.text); setShowQR(false); setTimeout(() => textRef.current?.focus(), 50); }}
                      className="text-left px-3 py-2 rounded-lg text-xs text-text-main hover:bg-primary/[0.06] hover:text-primary transition-colors border border-transparent hover:border-primary/15 flex items-start gap-2"
                    >
                      <span className="flex-shrink-0">{qr.emoji}</span>
                      {qr.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-surface-raised/5">
            {sortedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-10 h-10 text-text-muted/15 mb-3" />
                <p className="text-sm text-text-muted/50 font-medium">Sin notas aún</p>
                <p className="text-xs text-text-muted/30 mt-1">Escribe la primera nota del caso</p>
              </div>
            ) : (
              sortedNotes.map(note => (
                <NoteBubble key={note.id} note={note} currentUser={currentUser} />
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* Input footer */}
          <div className="border-t border-border bg-surface flex-shrink-0">
            {/* Quick reply toggle */}
            <div className="flex items-center px-4 pt-2.5 pb-1 gap-2">
              <button
                onClick={() => setShowQR(q => !q)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors',
                  showQR
                    ? 'text-primary border-primary/20 bg-primary/[0.08]'
                    : 'text-text-muted border-border hover:border-text-muted hover:text-text-main',
                )}
              >
                <Zap className="w-3 h-3" />
                Respuestas rápidas
              </button>
              {isDemo && (
                <span className="text-[10px] text-text-subtle italic">Modo demo</span>
              )}
            </div>

            {/* Textarea + buttons */}
            <div className="flex items-end gap-2 px-4 pb-3 pt-1">
              <textarea
                ref={textRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNote(text); }
                }}
                placeholder="Escribe una nota técnica... (Enter para enviar, Shift+Enter para nueva línea)"
                rows={3}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border resize-none transition-colors bg-surface-input text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/40 border-border"
              />
              <div className="flex flex-col gap-1.5 flex-shrink-0 pb-0.5">
                <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,.pdf,.doc,.docx" />
                <button
                  onClick={() => fileRef.current?.click()}
                  title="Adjuntar archivo"
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-raised transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => sendNote(text)}
                  disabled={!text.trim() || saving}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                    text.trim() && !saving
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                      : 'bg-border/60 text-text-muted/40 cursor-not-allowed',
                  )}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Detail panel (expanded row) ────────────────────────────────── */
const DetailPanel = ({ ticket, onOpenChat }: { ticket: Ticket; onOpenChat: () => void }) => {
  const typeCfg = resolveType(ticket.type);
  const TypeIcon = typeCfg.icon;
  const hasSurvey = ticket.notes.some(n => n.content.includes(SURVEY_MARKER));

  const timelineEvents = useMemo(() => {
    const ev: { icon: React.ElementType; color: string; label: string; time: string }[] = [
      { icon: FileText, color: 'text-text-muted', label: 'Ticket creado', time: ticket.createdAt },
    ];
    if (['IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'].includes(ticket.status)) {
      ev.push({ icon: Clock, color: 'text-primary', label: 'En atención', time: ticket.updatedAt });
    }
    if (ticket.status === 'WAITING') {
      ev.push({ icon: Coffee, color: 'text-warning', label: 'En espera de respuesta', time: ticket.updatedAt });
    }
    if (ticket.resolvedAt) {
      ev.push({ icon: CheckCircle2, color: 'text-success', label: 'Resuelto', time: ticket.resolvedAt });
    }
    if (hasSurvey) {
      ev.push({ icon: Radio, color: 'text-success', label: 'Encuesta enviada por WhatsApp', time: ticket.resolvedAt ?? ticket.updatedAt });
    }
    return ev;
  }, [ticket, hasSurvey]);

  return (
    <div className="overflow-y-auto p-5 space-y-5" style={{ maxHeight: 460 }}>
      {/* Ticket header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn('p-2.5 rounded-xl border flex-shrink-0', typeCfg.bg, typeCfg.border)}>
            <TypeIcon className={cn('w-5 h-5', typeCfg.color)} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-main leading-tight">{ticket.title}</h3>
            <p className="text-xs text-text-muted mt-0.5">{ticket.client?.name} · {typeCfg.label}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <ProgressSteps status={ticket.status} />
            </div>
            {ticket.assignedTo && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <User className="w-3 h-3 text-text-muted" />
                <span className="text-[11px] text-text-muted">Asignado a <span className="font-semibold text-text-main">{ticket.assignedTo}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Open chat modal button */}
        <button
          onClick={onOpenChat}
          className={cn(
            'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors',
            ticket.notes.length > 0
              ? 'text-primary border-primary/20 bg-primary/[0.06] hover:bg-primary/[0.12]'
              : 'text-text-muted border-border hover:bg-surface-raised hover:text-text-main',
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Notas
          {ticket.notes.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {ticket.notes.length}
            </span>
          )}
        </button>
      </div>

      {/* Client */}
      <div className="rounded-xl border border-border bg-surface-raised/30 p-4 space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-3">Cliente</p>
        {ticket.client?.phone && (
          <div className="flex items-center gap-2 text-xs">
            <Phone className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="font-mono text-text-main">{ticket.client.phone}</span>
            <a href={`https://wa.me/${ticket.client.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
              className="text-[#25d366] text-[10px] font-medium hover:underline ml-auto">WhatsApp</a>
          </div>
        )}
        {ticket.client?.plan && (
          <div className="flex items-center gap-2 text-xs">
            <Wrench className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="text-text-main">{ticket.client.plan}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {ticket.description && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-2">Descripción del problema</p>
          <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>
      )}

      {/* Resolution */}
      {ticket.resolution && (
        <div className="rounded-xl border border-success/15 bg-success/[0.04] p-4">
          <p className="text-[10px] font-bold text-success/70 uppercase tracking-[0.12em] mb-2">Resolución</p>
          <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed">{ticket.resolution}</p>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-3">Línea de tiempo</p>
        <div>
          {timelineEvents.map((ev, i) => {
            const Icon = ev.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn('p-1 rounded-full border bg-surface', ev.color, 'border-current/20')}>
                    <Icon className="w-3 h-3" />
                  </div>
                  {i < timelineEvents.length - 1 && <div className="w-px h-4 bg-border" />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-xs font-medium text-text-main">{ev.label}</p>
                  <p className="text-[10px] text-text-muted font-mono">
                    {format(new Date(ev.time), 'd MMM yyyy, HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Ticket row ─────────────────────────────────────────────────── */
const TicketRow = ({
  ticket, isExpanded, onToggle, canManage, onReload,
  onOpenCloseModal, onOpenChat, currentUser,
}: {
  ticket: Ticket; isExpanded: boolean; onToggle: () => void;
  canManage: boolean; onReload: () => void;
  onOpenCloseModal: (id: string) => void;
  onOpenChat: (ticket: Ticket) => void;
  currentUser: string;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const typeCfg = resolveType(ticket.type);
  const TypeIcon = typeCfg.icon;
  const isDemo = !!ticket._isDemo;

  const changeStatus = async (status: Ticket['status'], extra?: Record<string, unknown>) => {
    if (isDemo) return;
    setIsUpdating(true);
    try { await apiUpdateTicket(ticket.id, { status, ...extra }); onReload(); }
    catch { toast.error('Error al actualizar el ticket'); }
    finally { setIsUpdating(false); }
  };

  const isOpen       = ticket.status === 'OPEN';
  const isInProgress = ticket.status === 'IN_PROGRESS';
  const isWaiting    = ticket.status === 'WAITING';
  const isResolved   = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onToggle}
        className="cursor-pointer border-b border-border hover:bg-surface-raised/40 transition-colors duration-100"
      >
        {/* Title */}
        <td className="py-3 px-5">
          <div className="flex items-center gap-2.5">
            <div className={cn('p-1.5 rounded-lg border flex-shrink-0', typeCfg.bg, typeCfg.border)}>
              <TypeIcon className={cn('w-3.5 h-3.5', typeCfg.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-text-main leading-snug truncate">{ticket.title}</p>
                {isDemo && <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-subtle uppercase tracking-wide">Demo</span>}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5 truncate">{ticket.client?.name ?? '—'}</p>
            </div>
          </div>
        </td>

        <td className="py-3 px-4"><TypeBadge type={ticket.type} /></td>
        <td className="py-3 px-4"><PriorityBadge priority={ticket.priority} /></td>

        {/* Status */}
        <td className="py-3 px-4">
          <div className="flex flex-col gap-1">
            <StatusBadge status={ticket.status} />
            <ProgressSteps status={ticket.status} />
            {ticket.assignedTo && (
              <div className="flex items-center gap-1 mt-0.5">
                <User className="w-2.5 h-2.5 text-text-muted" />
                <span className="text-[10px] text-text-muted truncate max-w-[100px]">{ticket.assignedTo}</span>
              </div>
            )}
          </div>
        </td>

        {/* Date */}
        <td className="py-3 px-4 whitespace-nowrap">
          <p className="text-[11px] font-mono text-text-main">{format(new Date(ticket.createdAt), 'd MMM yyyy', { locale: es })}</p>
          <p className="text-[10px] text-text-muted font-mono">{format(new Date(ticket.createdAt), 'HH:mm', { locale: es })}</p>
        </td>

        {/* Actions */}
        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1 flex-wrap">
            {canManage && isOpen && !isDemo && (
              <button onClick={() => changeStatus('IN_PROGRESS', { assignedTo: currentUser })} disabled={isUpdating}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-primary border-primary/20 bg-primary/[0.06] hover:bg-primary/[0.12] transition-colors disabled:opacity-50">
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}Atender
              </button>
            )}
            {canManage && isInProgress && !isDemo && (
              <button onClick={() => changeStatus('WAITING')} disabled={isUpdating}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-warning border-warning/20 bg-warning/[0.05] hover:bg-warning/[0.12] transition-colors disabled:opacity-50">
                <Coffee className="w-3 h-3" />En espera
              </button>
            )}
            {canManage && isWaiting && !isDemo && (
              <button onClick={() => changeStatus('IN_PROGRESS')} disabled={isUpdating}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-primary border-primary/20 bg-primary/[0.06] hover:bg-primary/[0.12] transition-colors disabled:opacity-50">
                <RotateCcw className="w-3 h-3" />Reanudar
              </button>
            )}
            {canManage && !isResolved && !isDemo && (
              <button onClick={() => onOpenCloseModal(ticket.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-success border-success/20 bg-success/[0.05] hover:bg-success/[0.12] transition-colors">
                <CheckCircle2 className="w-3 h-3" />Resolver
              </button>
            )}
            {isResolved && !isDemo && (
              <button onClick={() => changeStatus('OPEN')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-text-muted border-border hover:bg-surface-raised transition-colors">
                <RotateCcw className="w-3 h-3" />Reabrir
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); onToggle(); }}
              className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-surface-raised transition-colors">
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </td>
      </motion.tr>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={6} className="p-0 border-b border-border border-l-2 border-l-primary">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden bg-surface-raised/5"
              >
                <DetailPanel ticket={ticket} onOpenChat={() => onOpenChat(ticket)} />
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Support Page ───────────────────────────────────────────────── */
export const SupportPage = () => {
  const { user } = useAuth();
  const [realTickets,   setRealTickets]   = useState<Ticket[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [typeFilter,    setTypeFilter]    = useState<string>('all');
  const [expandedRows,  setExpandedRows]  = useState<Set<string>>(new Set());
  const [chatTicket,    setChatTicket]    = useState<Ticket | null>(null);
  const [closeTicketId, setCloseTicketId] = useState<string | null>(null);
  const [showArchived,  setShowArchived]  = useState(false);

  const canManage   = hasPermission(user?.role, 'manage_support');
  const currentUser = user?.name ?? 'Operador';
  const tickets     = useMemo(() => [...realTickets, ...DEMO_TICKETS], [realTickets]);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await apiGetTickets() as Ticket[];
      setRealTickets(data);
      // Refresh chat modal ticket if open
      if (chatTicket && !chatTicket._isDemo) {
        const updated = data.find(t => t.id === chatTicket.id);
        if (updated) setChatTicket(updated);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCloseSuccess = async (ticketId: string) => {
    const ticket = realTickets.find(t => t.id === ticketId);
    if (ticket?.client?.phone) {
      try {
        await apiAddTicketNote(ticketId,
          `Encuesta de satisfacción enviada al cliente (${ticket.client.phone}) vía WhatsApp ${SURVEY_MARKER}`,
          'Sistema');
      } catch { /* non-blocking */ }
    }
    setCloseTicketId(null);
    loadTickets();
  };

  const toggleRow = (id: string) =>
    setExpandedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const typeOptions = useMemo(() => Array.from(new Set(tickets.map(t => resolveType(t.type).label))), [tickets]);

  const ACTIVE_STATUSES   = new Set(['OPEN', 'IN_PROGRESS', 'WAITING']);
  const ARCHIVED_STATUSES = new Set(['RESOLVED', 'CLOSED']);

  const filtered = useMemo(() => tickets.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchQ = t.title.toLowerCase().includes(q) || (t.client?.name.toLowerCase().includes(q) ?? false) || t.type.toLowerCase().includes(q);
    const matchT = typeFilter === 'all' || resolveType(t.type).label === typeFilter;
    const matchA = showArchived ? ARCHIVED_STATUSES.has(t.status) : ACTIVE_STATUSES.has(t.status);
    return matchQ && matchT && matchA;
  }), [tickets, searchQuery, typeFilter, showArchived]);

  const stats = useMemo(() => ({
    open:       realTickets.filter(t => t.status === 'OPEN').length,
    inProgress: realTickets.filter(t => t.status === 'IN_PROGRESS').length,
    waiting:    realTickets.filter(t => t.status === 'WAITING').length,
    resolved:   realTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    active:     realTickets.filter(t => ACTIVE_STATUSES.has(t.status)).length,
  }), [realTickets]);

  const closeTicket = useMemo(() => realTickets.find(t => t.id === closeTicketId) ?? null, [realTickets, closeTicketId]);
  const SELECT_CLS = 'px-3 py-2 rounded-lg text-sm border border-border bg-surface text-text-main focus:outline-none focus:border-primary/35 transition-colors cursor-pointer';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Soporte Técnico</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {stats.active} activo{stats.active !== 1 ? 's' : ''} · {stats.resolved} resuelto{stats.resolved !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar ticket, cliente o tipo..."
              className="pl-9 pr-3 py-2 rounded-lg border border-border text-sm bg-surface text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/35 transition-colors w-56" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={SELECT_CLS}>
            <option value="all">Todos los tipos</option>
            {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-border rounded-xl bg-surface overflow-hidden" style={{ boxShadow: 'rgba(0,0,0,0.03) 0px 2px 12px' }}>
        {[
          { icon: AlertCircle, label: 'Abiertos',    value: stats.open,       color: 'var(--color-text-muted)', trend: 'sin atender' },
          { icon: Clock,       label: 'En progreso', value: stats.inProgress, color: 'var(--color-primary)',    trend: 'en atención' },
          { icon: Coffee,      label: 'En espera',   value: stats.waiting,    color: 'var(--color-warning)',    trend: 'esperando'   },
          { icon: CheckCircle2,label: 'Resueltos',   value: stats.resolved,   color: 'var(--color-success)',    trend: 'completados' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn('stat-block', i < 3 && 'border-r border-border')}>
              <span className="stat-block-label"><Icon className="w-3 h-3" />{s.label.toUpperCase()}</span>
              <span className="stat-block-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stat-block-trend">{s.trend}</span>
            </div>
          );
        })}
      </div>

      {/* Archive toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setShowArchived(false)}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors',
            !showArchived ? 'bg-primary/[0.08] border-primary/20 text-primary' : 'border-border text-text-muted hover:bg-surface-raised hover:text-text-main')}>
          <Inbox className="w-3.5 h-3.5" />Activos <span className="font-mono opacity-70">{stats.active}</span>
        </button>
        <button onClick={() => setShowArchived(true)}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors',
            showArchived ? 'bg-surface-raised border-border text-text-main' : 'border-border text-text-muted hover:bg-surface-raised hover:text-text-main')}>
          <Archive className="w-3.5 h-3.5" />Archivados <span className="font-mono opacity-70">{stats.resolved}</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <span className="text-text-muted text-sm font-mono">Cargando tickets...</span>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden" style={{ boxShadow: 'rgba(0,0,0,0.03) 0px 2px 12px' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised/30">
                  {['Ticket', 'Tipo', 'Prioridad', 'Estado', 'Fecha', 'Acciones'].map(col => (
                    <th key={col} className="text-left text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] px-4 lg:px-5 py-3 first:pl-5">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    isExpanded={expandedRows.has(t.id)}
                    onToggle={() => toggleRow(t.id)}
                    canManage={canManage}
                    onReload={loadTickets}
                    onOpenCloseModal={setCloseTicketId}
                    onOpenChat={setChatTicket}
                    currentUser={currentUser}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              {showArchived ? <Archive className="w-8 h-8 mx-auto mb-3 text-text-muted/20" /> : <MessageSquare className="w-8 h-8 mx-auto mb-3 text-text-muted/20" />}
              <p className="text-sm font-medium text-text-muted">{showArchived ? 'Sin tickets archivados' : 'Sin tickets activos'}</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-2.5 border-t border-border bg-surface-raised/15">
              <p className="text-[11px] text-text-muted font-mono">
                {filtered.filter(t => !t._isDemo).length} real{filtered.filter(t => !t._isDemo).length !== 1 ? 'es' : ''} · {DEMO_TICKETS.length} demo · {filtered.length} total
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chat modal */}
      <AnimatePresence>
        {chatTicket && (
          <ChatModal
            ticket={chatTicket}
            currentUser={currentUser}
            canManage={canManage}
            onReload={loadTickets}
            onClose={() => setChatTicket(null)}
          />
        )}
      </AnimatePresence>

      {/* Close ticket modal */}
      {closeTicketId && closeTicket && (
        <TicketCloseModal
          ticketId={closeTicketId}
          ticketTitle={closeTicket.title}
          onClose={() => setCloseTicketId(null)}
          onSuccess={() => handleCloseSuccess(closeTicketId)}
        />
      )}
    </motion.div>
  );
};
