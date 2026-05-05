import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Bell, Wrench, Gift, Info, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { apiGetClientHistory } from '@/services/api';
import type { ClientCommHistory } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

const TYPE_ICON: Record<string, typeof MessageSquare> = {
  payment_reminder:  MessageSquare,
  suspension_notice: Bell,
  maintenance_alert: Wrench,
  promotion:         Gift,
  general:           Info,
};

const TYPE_LABEL: Record<string, string> = {
  payment_reminder:  'Recordatorio de pago',
  suspension_notice: 'Aviso de suspensión',
  maintenance_alert: 'Mantenimiento',
  promotion:         'Promoción',
  general:           'General',
};

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email:    'Email',
  sms:      'SMS',
};

export const ClientHistoryPanel = ({ clientId, clientName, onClose }: Props) => {
  const [history, setHistory] = useState<ClientCommHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetClientHistory(clientId)
      .then((res: any) => setHistory((res.data ?? []).map((h: any) => ({ ...h, id: h._id ?? h.id }))))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-surface border-l border-border z-50 flex flex-col shadow-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="display-heading text-base text-text-main">Historial de mensajes</h3>
            <p className="text-xs text-text-muted mt-0.5">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-text-muted hover:text-text-main hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <span className="text-xs text-text-muted data-mono">Cargando historial...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <MessageSquare className="w-8 h-8 text-text-subtle" />
              <span className="text-sm text-text-muted">Sin comunicados enviados</span>
            </div>
          ) : (
            <div className="space-y-0">
              {history.map((item, i) => {
                const Icon = TYPE_ICON[item.type] ?? Info;
                const isLast = i === history.length - 1;
                return (
                  <div key={item.id} className="flex gap-3 pb-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="timeline-dot flex items-center justify-center">
                        <Icon className="w-2.5 h-2.5 text-text-subtle" />
                      </div>
                      {!isLast && <div className="timeline-line relative" style={{ position: 'unset', width: 1, flex: 1, background: 'var(--color-border)', marginTop: 2 }} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-text-main leading-snug">{item.title}</span>
                        {item.deliveryStatus === 'sent'
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                          : item.deliveryStatus === 'failed'
                          ? <XCircle className="w-3.5 h-3.5 text-danger flex-shrink-0 mt-0.5" />
                          : null
                        }
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] px-1.5 py-0.5 rounded border border-border text-text-muted data-mono">
                          {TYPE_LABEL[item.type] ?? item.type}
                        </span>
                        {item.channels.map(ch => (
                          <span key={ch} className="text-[10px] text-text-subtle">
                            {CHANNEL_LABEL[ch] ?? ch}
                          </span>
                        ))}
                      </div>
                      {item.sentAt && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-text-subtle data-mono">
                          <Clock className="w-3 h-3" />
                          {format(new Date(item.sentAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
