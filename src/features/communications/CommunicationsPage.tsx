import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Clock, CheckCircle2, XCircle,
  Bell, Wrench, DollarSign, Megaphone, FileText, Plus, X, Eye, WifiOff,
  Mail, User, Info, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  apiGetCommunications, apiSendCommunication,
} from '@/services/api';

type CommType   = 'payment_reminder' | 'suspension_notice' | 'maintenance_alert' | 'outage_notice' | 'promotion' | 'general';
type CommStatus = 'sent' | 'failed' | 'delivered';

interface Communication {
  id:          string;
  title:       string;
  body:        string;
  type:        CommType;
  status:      CommStatus;
  sentAt:      string;
  clientId?:   string | null;
  sentByName?: string | null;
  channels?:   string[];
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.11 1.523 5.836L.057 23.214a.75.75 0 0 0 .924.924l5.378-1.466A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.708 9.708 0 0 1-4.951-1.354l-.355-.21-3.688 1.005 1.005-3.688-.21-.355A9.708 9.708 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
  </svg>
);

// ─── Types that use variable per-client data (cannot be truly "bulk") ─────────
const VARIABLE_DATA_TYPES: CommType[] = ['payment_reminder', 'suspension_notice', 'outage_notice'];

// ─── Plantillas ───────────────────────────────────────────────────────────────

interface TemplateField {
  key:         string;
  label:       string;
  placeholder: string;
  type?:       'text' | 'date' | 'time' | 'number';
}

interface TemplateConfig {
  fields:          TemplateField[];
  titleSuggestion: (vars: Record<string, string>) => string;
  build:           (vars: Record<string, string>) => string;
}

const TEMPLATES: Record<CommType, TemplateConfig> = {
  payment_reminder: {
    fields: [
      { key: 'amount',  label: 'Monto adeudado',                  placeholder: 'Ej: $95.000',        type: 'text' },
      { key: 'dueDate', label: 'Fecha límite de pago',             placeholder: 'Ej: 10 de abril',    type: 'text' },
      { key: 'contact', label: 'Teléfono de contacto (opcional)',  placeholder: 'Ej: 300 123 4567',   type: 'text' },
    ],
    titleSuggestion: (v) => `Recordatorio de pago${v.dueDate ? ` — vence ${v.dueDate}` : ''}`,
    build: (v) =>
`Hola {nombre} 👋

Le recordamos amablemente que tiene un saldo pendiente${v.amount ? ` de *${v.amount}*` : ''} con su servicio de internet Nexory.

📅 *Fecha límite:* ${v.dueDate || '(por confirmar)'}

Para evitar interrupciones en su servicio, le pedimos realizar el pago antes de la fecha indicada. 🙏

Si ya realizó el pago, por favor háganos saber y lo verificamos de inmediato.${v.contact ? `\n\n📞 *${v.contact}*` : ''}

¡Gracias por confiar en nosotros!
*Equipo Nexory* 🌐`,
  },

  suspension_notice: {
    fields: [
      { key: 'amount',         label: 'Monto adeudado',                  placeholder: 'Ej: $95.000',       type: 'text' },
      { key: 'suspensionDate', label: 'Fecha de suspensión',             placeholder: 'Ej: 12 de abril',   type: 'text' },
      { key: 'contact',        label: 'Teléfono de contacto (opcional)', placeholder: 'Ej: 300 123 4567',  type: 'text' },
    ],
    titleSuggestion: (v) => `Aviso de suspensión${v.suspensionDate ? ` — ${v.suspensionDate}` : ''}`,
    build: (v) =>
`Hola {nombre}, le informamos lo siguiente ⚠️

Su servicio de internet *Nexory* tiene programada una suspensión el *${v.suspensionDate || '(fecha por confirmar)'}* por un saldo pendiente${v.amount ? ` de *${v.amount}*` : ''}.

Para evitar la interrupción de su servicio, le pedimos realizar el pago antes de esa fecha.

💳 Una vez realizado el pago, su servicio se restablece de forma inmediata.${v.contact ? `\n\n📞 Comuníquese con nosotros al *${v.contact}* para cualquier consulta.` : ''}

Agradecemos su comprensión.
*Equipo Nexory* 🌐`,
  },

  maintenance_alert: {
    fields: [
      { key: 'cause',     label: 'Causa del mantenimiento', placeholder: 'Ej: Cambio de fibra óptica en el sector norte', type: 'text' },
      { key: 'startTime', label: 'Fecha y hora de inicio',  placeholder: 'Ej: Sábado 12 de abril a las 2:00 a.m.',        type: 'text' },
      { key: 'duration',  label: 'Duración estimada',        placeholder: 'Ej: 2 a 3 horas',                               type: 'text' },
    ],
    titleSuggestion: (v) => `Mantenimiento programado${v.startTime ? ` — ${v.startTime}` : ''}`,
    build: (v) =>
`Hola {nombre} 👋

Le informamos que realizaremos un *mantenimiento programado* en su zona de servicio.

🔧 *Motivo:* ${v.cause || '(por confirmar)'}
🕐 *Inicio:* ${v.startTime || '(por confirmar)'}
⏱️ *Duración estimada:* ${v.duration || '(por confirmar)'}

Durante este tiempo, es posible que experimente interrupciones momentáneas en su conexión. Nuestro equipo técnico trabajará lo más rápido posible para minimizar el impacto. 🛠️

Le pedimos disculpas por los inconvenientes y agradecemos su comprensión. 🙏

*Equipo Nexory* 🌐`,
  },

  outage_notice: {
    fields: [
      { key: 'sector',     label: 'Sector o zona afectada',           placeholder: 'Ej: Sector norte de Zipaquirá', type: 'text' },
      { key: 'cause',      label: 'Causa conocida (opcional)',         placeholder: 'Ej: Falla en enlace de fibra',  type: 'text' },
      { key: 'updateTime', label: 'Próxima actualización en',          placeholder: 'Ej: 30 minutos',               type: 'text' },
    ],
    titleSuggestion: (v) => `Corte de servicio${v.sector ? ` — ${v.sector}` : ''}`,
    build: (v) =>
`Hola {nombre} 🔴

Le informamos que en este momento estamos presentando una *falla en el servicio de internet* en ${v.sector || 'su sector'}.${v.cause ? `\n\n⚡ *Causa:* ${v.cause}` : ''}

Nuestro equipo técnico ya está trabajando para restablecer el servicio lo antes posible. 🛠️

${v.updateTime ? `🕐 Le daremos una actualización en *${v.updateTime}*.\n\n` : ''}Lamentamos los inconvenientes causados y agradecemos su paciencia. 🙏

*Equipo Nexory* 🌐`,
  },

  promotion: {
    fields: [
      { key: 'promoName', label: 'Nombre de la promoción',  placeholder: 'Ej: Plan Fibra 100 Megas',       type: 'text' },
      { key: 'benefit',   label: 'Beneficio principal',     placeholder: 'Ej: El primer mes sin costo',    type: 'text' },
      { key: 'deadline',  label: 'Válida hasta (opcional)', placeholder: 'Ej: 30 de abril',                type: 'text' },
      { key: 'contact',   label: 'Forma de contacto',       placeholder: 'Ej: escríbenos al 300 123 4567', type: 'text' },
    ],
    titleSuggestion: (v) => v.promoName ? `Promoción: ${v.promoName}` : 'Nueva promoción especial',
    build: (v) =>
`Hola {nombre} 🎉

¡Tenemos una oferta especial para usted!

🚀 *${v.promoName || 'Oferta exclusiva Nexory'}*
✅ ${v.benefit || 'Beneficios exclusivos para clientes Nexory'}
${v.deadline ? `📅 *Válida hasta:* ${v.deadline}\n` : ''}
No deje pasar esta oportunidad. ${v.contact ? `Para más información, ${v.contact}.` : 'Comuníquese con nosotros para más detalles.'}

¡Gracias por ser parte de la familia Nexory! 😊
*Equipo Nexory* 🌐`,
  },

  general: {
    fields: [
      { key: 'body', label: 'Mensaje', placeholder: 'Escriba el mensaje. Use {nombre} donde quiera que aparezca el nombre real de cada cliente.', type: 'text' },
    ],
    titleSuggestion: () => 'Comunicado general',
    build: (v) => v.body || '',
  },
};

// ─── Config de tipos y estados ────────────────────────────────────────────────

const typeConfig: Record<CommType, { label: string; icon: React.ElementType; cls: string }> = {
  payment_reminder:  { label: 'Recordatorio de Pago', icon: DollarSign, cls: 'text-warning  bg-warning/10  border-warning/20'  },
  suspension_notice: { label: 'Aviso de Suspensión',  icon: Bell,       cls: 'text-danger   bg-danger/10   border-danger/20'   },
  maintenance_alert: { label: 'Mantenimiento',         icon: Wrench,     cls: 'text-primary  bg-primary/10  border-primary/20'  },
  outage_notice:     { label: 'Corte de Servicio',     icon: WifiOff,    cls: 'text-danger   bg-danger/10   border-danger/20'   },
  promotion:         { label: 'Promoción',             icon: Megaphone,  cls: 'text-success  bg-success/10  border-success/20'  },
  general:           { label: 'General',               icon: FileText,   cls: 'text-text-muted bg-border/40 border-border'      },
};

const statusConfig: Record<CommStatus, { label: string; cls: string }> = {
  sent:      { label: 'Enviado',   cls: 'badge-resolved'  },
  delivered: { label: 'Entregado', cls: 'badge-resolved'  },
  failed:    { label: 'Fallido',   cls: 'badge-suspended' },
};

// ─── Channel toggle button ────────────────────────────────────────────────────

const ChannelButton = ({
  channel, active, onClick,
}: { channel: 'whatsapp' | 'email'; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 rounded border text-xs font-medium transition-all ${
      active
        ? channel === 'whatsapp'
          ? 'bg-[#25d366]/10 border-[#25d366]/40 text-[#1a7a3e]'
          : 'bg-primary/10 border-primary/30 text-primary'
        : 'border-border text-text-muted hover:bg-surface-raised hover:text-text-main'
    }`}
  >
    {channel === 'whatsapp'
      ? <WhatsAppIcon className="w-3.5 h-3.5" />
      : <Mail className="w-3.5 h-3.5" />}
    {channel === 'whatsapp' ? 'WhatsApp' : 'Correo'}
  </button>
);

// ─── Channel icons display (in table) ────────────────────────────────────────

const ChannelIcons = ({ channels }: { channels?: string[] }) => {
  const list = channels ?? ['whatsapp'];
  return (
    <div className="flex items-center gap-1.5">
      {list.includes('whatsapp') && (
        <span title="WhatsApp" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#25d366]/15 text-[#1a7a3e]">
          <WhatsAppIcon className="w-3 h-3" />
        </span>
      )}
      {list.includes('email') && (
        <span title="Correo" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary">
          <Mail className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const CommunicationsPage = () => {
  const [items,       setItems]       = useState<Communication[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [typeFilter,  setTypeFilter]  = useState<CommType | 'all'>('all');
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    title:      '',
    type:       'payment_reminder' as CommType,
    channels:   ['whatsapp'] as string[],
    targetAll:  true,
    targetTags: [] as string[],
  });

  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});

  const handleTypeChange = (newType: CommType) => {
    setTemplateVars({});
    setShowPreview(false);
    const suggestion = TEMPLATES[newType].titleSuggestion({});
    setForm(f => ({ ...f, type: newType, title: suggestion }));
  };

  const setVar = (key: string, value: string) => {
    setTemplateVars(prev => {
      const next = { ...prev, [key]: value };
      const suggestion = TEMPLATES[form.type].titleSuggestion(next);
      setForm(f => ({ ...f, title: suggestion }));
      return next;
    });
  };

  const toggleChannel = (ch: string) => {
    setForm(f => {
      const has = f.channels.includes(ch);
      const next = has ? f.channels.filter(c => c !== ch) : [...f.channels, ch];
      return { ...f, channels: next.length ? next : [ch] }; // at least one
    });
  };

  const generatedBody = TEMPLATES[form.type].build(templateVars);
  const isVariableType = VARIABLE_DATA_TYPES.includes(form.type);

  useEffect(() => { loadItems(); }, []);
  useEffect(() => {
    if (showModal) {
      const suggestion = TEMPLATES[form.type].titleSuggestion({});
      setForm(f => ({ ...f, title: suggestion }));
    }
  }, [showModal]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await apiGetCommunications() as any[];
      const mapped: Communication[] = data.map((c: any) => ({
        id:         c.id,
        title:      c.title,
        body:       c.body,
        type:       (c.type as string).toLowerCase() as CommType,
        status:     (c.status as string).toLowerCase() as CommStatus,
        sentAt:     c.sentAt,
        clientId:   c.clientId ?? null,
        sentByName: c.sentByName ?? null,
        channels:   c.channels ?? ['whatsapp'],
      }));
      setItems(mapped);
    } catch { /* backend no disponible */ }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await apiSendCommunication({
        type:      form.type.toUpperCase(),
        title:     form.title,
        body:      generatedBody,
        clientIds: form.targetAll ? 'all' : [],
        channels:  form.channels,
      });
      setShowModal(false);
      setForm({ title: '', type: 'payment_reminder', channels: ['whatsapp'], targetAll: true, targetTags: [] });
      setTemplateVars({});
      setShowPreview(false);
      loadItems();
    } catch {
      alert('Error al enviar comunicado');
    }
  };

  const stats = {
    total:  items.length,
    sent:   items.filter(i => i.status === 'sent' || i.status === 'delivered').length,
    failed: items.filter(i => i.status === 'failed').length,
  };

  const filteredItems = typeFilter === 'all'
    ? items
    : items.filter(i => i.type === typeFilter);

  const template  = TEMPLATES[form.type];
  const canCreate = form.title.trim().length > 0 && generatedBody.trim().length > 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-text-muted text-sm data-mono">cargando comunicados...</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="section-divider">
        <h1 className="section-divider-title" style={{ fontSize: '1.25rem' }}>
          Comunicados
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          className="btn-action btn-action-cyan px-4 py-2 text-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Comunicado
        </motion.button>
      </div>

      {/* Stat blocks */}
      <div className="flex gap-3 flex-wrap">
        <div className="stat-block">
          <span className="stat-block-label">Total</span>
          <span className="stat-block-value">{stats.total}</span>
        </div>
        <div className="stat-block">
          <span className="stat-block-label">Enviados</span>
          <span className="stat-block-value text-success">{stats.sent}</span>
        </div>
        <div className="stat-block">
          <span className="stat-block-label">Fallidos</span>
          <span className="stat-block-value text-danger">{stats.failed}</span>
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTypeFilter('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
            typeFilter === 'all'
              ? 'bg-surface-raised border-border text-text-main'
              : 'border-border/50 text-text-muted hover:text-text-main hover:bg-surface-raised'
          }`}
        >
          Todos
          <span className="opacity-60 data-mono">{items.length}</span>
        </button>
        {(Object.entries(typeConfig) as [CommType, typeof typeConfig[CommType]][]).map(([key, cfg]) => {
          const Icon  = cfg.icon;
          const count = items.filter(i => i.type === key).length;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                typeFilter === key ? cfg.cls : 'border-border/50 text-text-muted hover:text-text-main hover:bg-surface-raised'
              }`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
              <span className="ml-1 opacity-60 data-mono">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-text-subtle" />
            <p className="text-sm text-text-muted font-medium">Sin comunicados aún</p>
            <p className="text-xs text-text-subtle mt-1">Crea el primero para notificar a tus clientes</p>
          </div>
        ) : (
          <table className="line-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Comunicado</th>
                <th>Canales</th>
                <th>Enviado por</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const cfg   = typeConfig[item.type] ?? typeConfig.general;
                const stCfg = statusConfig[item.status] ?? statusConfig.sent;
                const Icon  = cfg.icon;

                return (
                  <tr key={item.id}>
                    {/* Tipo — fixed width badge */}
                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium ${cfg.cls}`}
                        style={{ width: '156px', minWidth: '156px' }}
                      >
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{cfg.label}</span>
                      </span>
                    </td>

                    {/* Comunicado — title only */}
                    <td className="max-w-xs">
                      <p className="text-sm font-semibold text-text-main truncate">{item.title}</p>
                      <p className="text-[11px] text-text-subtle mt-0.5">
                        {item.clientId ? 'Individual' : 'Todos los clientes'}
                      </p>
                    </td>

                    {/* Canales */}
                    <td>
                      <ChannelIcons channels={item.channels} />
                    </td>

                    {/* Enviado por */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-raised border border-border flex-shrink-0">
                          <User className="w-2.5 h-2.5 text-text-muted" />
                        </span>
                        <span className="text-xs text-text-main truncate max-w-[120px]">
                          {item.sentByName ?? 'Sistema'}
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${stCfg.cls}`}>
                        {item.status === 'sent' || item.status === 'delivered'
                          ? <CheckCircle2 className="w-3 h-3" />
                          : item.status === 'failed'
                          ? <XCircle className="w-3 h-3" />
                          : <Clock className="w-3 h-3" />}
                        {stCfg.label}
                      </span>
                    </td>

                    {/* Fecha — exact */}
                    <td className="whitespace-nowrap">
                      <p className="text-xs text-text-main">
                        {format(new Date(item.sentAt), "d MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-[11px] text-text-subtle data-mono">
                        {format(new Date(item.sentAt), "HH:mm", { locale: es })}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Modal crear comunicado ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                  <h2 className="text-sm font-semibold text-text-main">Nuevo Comunicado</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 text-text-muted hover:text-text-main transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1">
                  <div className="px-6 py-5 space-y-5">

                    {/* Tipo de comunicado */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Tipo de comunicado
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(Object.entries(typeConfig) as [CommType, typeof typeConfig[CommType]][]).map(([key, cfg]) => {
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={key}
                              onClick={() => handleTypeChange(key)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded border text-xs font-medium text-left transition-all ${
                                form.type === key
                                  ? cfg.cls + ' ring-1 ring-inset ring-current/20'
                                  : 'border-border text-text-muted hover:bg-surface-raised hover:text-text-main'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aviso tipos de dato variable */}
                    {isVariableType && (
                      <div className="flex items-start gap-2.5 px-3 py-3 rounded border border-warning/30 bg-warning/5">
                        <Info className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-text-main leading-relaxed">
                          <span className="font-semibold">Este tipo usa datos personalizados por cliente</span> (montos, fechas).
                          Aunque lo envíes a todos, cada cliente recibe un mensaje con <span className="font-semibold">sus datos específicos</span>.
                          Asegúrate de completar la información correcta para el lote actual.
                        </p>
                      </div>
                    )}

                    {/* Título */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                        Título interno (solo para identificación)
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded border border-border text-sm bg-surface-input text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/40"
                      />
                    </div>

                    {/* Variables de la plantilla */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
                          Datos del mensaje
                        </label>
                        <span className="text-[10px] text-text-subtle px-1.5 py-0.5 rounded bg-surface-raised border border-border">
                          {'{nombre}'} → nombre real de cada cliente
                        </span>
                      </div>
                      <div className="space-y-3">
                        {template.fields.map(field => (
                          <div key={field.key}>
                            <label className="block text-xs text-text-muted mb-1">{field.label}</label>
                            {field.key === 'body' ? (
                              <textarea
                                rows={4}
                                value={templateVars[field.key] ?? ''}
                                onChange={e => setVar(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 rounded border border-border text-sm bg-surface-input text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/40 resize-none"
                              />
                            ) : (
                              <input
                                type={field.type ?? 'text'}
                                value={templateVars[field.key] ?? ''}
                                onChange={e => setVar(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 rounded border border-border text-sm bg-surface-input text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/40"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Canales de envío */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Canales de envío
                      </label>
                      <div className="flex gap-2">
                        <ChannelButton
                          channel="whatsapp"
                          active={form.channels.includes('whatsapp')}
                          onClick={() => toggleChannel('whatsapp')}
                        />
                        <ChannelButton
                          channel="email"
                          active={form.channels.includes('email')}
                          onClick={() => toggleChannel('email')}
                        />
                      </div>
                      {form.channels.includes('email') && (
                        <p className="text-[11px] text-text-subtle mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                          El envío por correo requiere que los clientes tengan email registrado.
                        </p>
                      )}
                    </div>

                    {/* Vista previa */}
                    <div>
                      <button
                        onClick={() => setShowPreview(p => !p)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {showPreview ? 'Ocultar vista previa' : 'Ver cómo llegará el mensaje'}
                      </button>

                      <AnimatePresence>
                        {showPreview && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 p-4 bg-[#e9f5e1] border border-[#c3e6a8] rounded">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-[#25d366] flex items-center justify-center">
                                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-[#1a7a3e] block">Nexory — Vista previa WhatsApp</span>
                                  <span className="text-[10px] text-[#3a8a5e]">{'{nombre}'} se reemplaza por el nombre real de cada cliente al momento del envío</span>
                                </div>
                              </div>
                              <div className="bg-white rounded p-3 shadow-sm max-w-sm">
                                <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                                  {generatedBody || '(completa los datos para ver el mensaje)'}
                                </p>
                                <p className="text-[10px] text-gray-400 text-right mt-1">ahora ✓✓</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Destinatarios */}
                    <div className="flex items-center gap-3 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.targetAll}
                          onChange={e => setForm(f => ({ ...f, targetAll: e.target.checked }))}
                          className="w-4 h-4 accent-cyan"
                        />
                        <span className="text-sm text-text-main">Enviar a todos los clientes activos</span>
                      </label>
                    </div>

                  </div>
                </div>

                {/* Footer modal */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border flex-shrink-0">
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-action btn-action-ghost px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!canCreate}
                    className="btn-action btn-action-cyan px-4 py-2 text-sm disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Ahora
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
