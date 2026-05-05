import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Clock, AlertTriangle, Activity } from 'lucide-react';
import { apiDiagnoseClient } from '@/services/api';

interface Props {
  clientId: string;
  clientName: string;
}

const getProbableCause = (diag: any): string => {
  if (!diag || !diag.online) return 'Cliente sin conexión al router. Verificar equipo en sitio.';
  if (diag.packetLoss > 50)  return 'Alta pérdida de paquetes. Posible corte de fibra o falla de ONU.';
  if (diag.latency > 100)    return 'Latencia elevada. Saturación de nodo o enlace degradado.';
  if (diag.signal < -80)     return 'Señal débil. Revisar apuntamiento de antena o obstrucción.';
  return 'Sin anomalías críticas detectadas. Revisar configuración local del cliente.';
};

export const PreDiagnosisPanel = ({ clientId, clientName }: Props) => {
  const [diag, setDiag] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiDiagnoseClient(clientId)
      .then((res: any) => setDiag(res?.data ?? null))
      .catch(() => setDiag(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
        <Activity className="w-3.5 h-3.5 animate-pulse" />
        <span className="data-mono">Ejecutando diagnóstico para {clientName}...</span>
      </div>
    );
  }

  if (!diag) return null;

  const cause = getProbableCause(diag);
  const signalPct = diag.signal ? Math.max(0, Math.min(100, ((diag.signal + 100) / 40) * 100)) : 0;
  const isWarning = diag.packetLoss > 10 || diag.latency > 100 || diag.signal < -80;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 border border-border rounded overflow-hidden"
    >
      {/* Metrics row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="px-4 py-3">
          <span className="section-label block mb-1.5">Señal</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full bg-primary"
                style={{ width: `${signalPct}%` }}
              />
            </div>
            <span className="data-mono text-xs font-semibold text-text-main">{diag.signal ?? '—'} dBm</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <span className="section-label block mb-1">Latencia</span>
          <span className={`data-mono text-sm font-bold ${diag.latency > 100 ? 'text-warning' : 'text-success'}`}>
            {diag.latency ?? '—'} ms
          </span>
        </div>
        <div className="px-4 py-3">
          <span className="section-label block mb-1">Pérd. Paquetes</span>
          <span className={`data-mono text-sm font-bold ${diag.packetLoss > 10 ? 'text-danger' : 'text-success'}`}>
            {diag.packetLoss ?? '—'} %
          </span>
        </div>
      </div>

      {/* Probable cause */}
      <div
        className={`flex items-start gap-2.5 px-4 py-3 text-xs ${isWarning ? 'notif-warning' : 'notif-success'}`}
      >
        {isWarning
          ? <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
          : <Wifi className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
        }
        <div>
          <span className="font-semibold text-text-main">Causa probable: </span>
          <span className="text-text-muted">{cause}</span>
        </div>
      </div>

      {diag.uptime && (
        <div className="px-4 py-2 border-t border-border flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="w-3 h-3" />
          <span className="data-mono">Uptime del enlace: {diag.uptime}</span>
        </div>
      )}
    </motion.div>
  );
};
