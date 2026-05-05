import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiCloseTicket } from '@/services/api';

interface Props {
  ticketId: string;
  ticketTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CHECKLIST_ITEMS = [
  'Cliente confirmó que el servicio fue restaurado',
  'Se documentó la causa raíz del problema',
  'Se actualizó la configuración del equipo si fue necesario',
  'Se realizó prueba de velocidad post-resolución',
  'Cliente notificado por WhatsApp',
];

export const TicketCloseModal = ({ ticketId, ticketTitle, onClose, onSuccess }: Props) => {
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allChecked = checked.every(Boolean);

  const toggle = (i: number) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const handleSubmit = async () => {
    if (!allChecked) return;
    setSaving(true);
    setError('');
    try {
      await apiCloseTicket(ticketId, {
        checklist: CHECKLIST_ITEMS.map((item, i) => ({ item, checked: checked[i] })),
        resolution,
        closedBy: 'operator',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Error al cerrar el ticket. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="relative bg-surface border border-border rounded shadow-lg w-full max-w-lg rounded-xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="display-heading text-base text-text-main">Cerrar Ticket</h3>
              <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{ticketTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-text-muted hover:text-text-main hover:bg-surface-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Checklist */}
          <div className="px-5 py-4 space-y-3">
            <p className="section-label mb-3">Lista de verificación</p>
            {CHECKLIST_ITEMS.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <div
                  className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
                    checked[i] ? 'bg-success border-success' : 'border-border group-hover:border-text-muted'
                  }`}
                  onClick={() => toggle(i)}
                >
                  {checked[i] && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${checked[i] ? 'text-text-muted line-through' : 'text-text-main'}`}>
                  {item}
                </span>
              </label>
            ))}
          </div>

          {/* Resolution text */}
          <div className="px-5 pb-4">
            <p className="section-label mb-2">Descripción de la resolución</p>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              placeholder="Describe qué se hizo para resolver el problema..."
              rows={3}
              className="w-full text-sm rounded border border-border bg-surface-input px-3 py-2 text-text-main placeholder:text-text-subtle resize-none focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {error && (
            <div className="mx-5 mb-3 flex items-center gap-2 text-xs text-danger notif-error rounded px-3 py-2 border">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <span className="text-xs text-text-muted data-mono">
              {checked.filter(Boolean).length}/{CHECKLIST_ITEMS.length} ítems completados
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="btn-action btn-action-ghost">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allChecked || saving}
                className={`btn-action ${allChecked ? 'btn-action-success' : 'opacity-40 cursor-not-allowed btn-action-ghost'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saving ? 'Cerrando...' : 'Cerrar ticket'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
