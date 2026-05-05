import { motion } from 'framer-motion';
import { Wifi, AlertTriangle, CheckCircle } from 'lucide-react';
import type { NetworkHealth } from '@/types';

interface Props {
  health: NetworkHealth;
}

const STATUS_LABEL: Record<string, string> = {
  green:  'Red operando con normalidad',
  yellow: 'Alertas activas en la red',
  red:    'Fallas críticas detectadas',
};

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  green:  CheckCircle,
  yellow: AlertTriangle,
  red:    AlertTriangle,
};

export const NetworkSemaphore = ({ health }: Props) => {
  const semClass = `semaphore-${health.status}`;
  const Icon = STATUS_ICON[health.status] ?? Wifi;
  const isPulsing = health.status !== 'green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`semaphore-bar flex items-center gap-4 px-4 py-3 mb-6 ${semClass}`}
    >
      {/* Dot */}
      <div className={`semaphore-dot ${isPulsing ? 'pulse-dot' : ''}`} />

      {/* Icon + label */}
      <div className="flex items-center gap-2 flex-1">
        <Icon className="w-4 h-4" style={{ color: 'var(--sem-color)' }} />
        <span className="text-sm font-semibold text-text-main">{STATUS_LABEL[health.status]}</span>
        {health.issues.length > 0 && (
          <span className="text-xs text-text-muted hidden sm:block">
            — {health.issues[0].description}
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex flex-col items-end">
          <span className="section-label">Latencia</span>
          <span className="data-mono font-semibold text-text-main">{health.latencyAvg}ms</span>
        </div>
        <div className="w-px h-6 bg-current opacity-20" />
        <div className="flex flex-col items-end">
          <span className="section-label">Routers</span>
          <span className="data-mono font-semibold text-text-main">{health.routersOnline}/{health.routersTotal}</span>
        </div>
        <div className="w-px h-6 bg-current opacity-20" />
        <div className="flex flex-col items-end">
          <span className="section-label">Pkt Loss</span>
          <span className="data-mono font-semibold text-text-main">{health.packetLoss}%</span>
        </div>
      </div>
    </motion.div>
  );
};
