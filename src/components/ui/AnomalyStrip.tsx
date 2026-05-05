import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import type { Anomaly } from '@/types';

interface Props {
  anomalies: Anomaly[];
  onDismiss?: (id: string) => void;
}

export const AnomalyStrip = ({ anomalies, onDismiss }: Props) => {
  const active = anomalies.filter(a => !a.resolved);
  if (active.length === 0) return null;

  const first = active[0];
  const rest = active.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key={first.id}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="task-high mb-6 flex items-start gap-3 px-4 py-3 bg-surface rounded"
        style={{ borderColor: 'var(--color-warning)', background: 'rgba(180,83,9,0.04)' }}
      >
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-main">{first.title}</span>
            {rest > 0 && (
              <span className="text-[11px] data-mono text-text-muted">
                +{rest} anomalía{rest > 1 ? 's' : ''} más
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{first.description}</p>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(first.id)}
            className="p-1 rounded text-text-muted hover:text-text-main transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
