import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, CreditCard, Calendar, Download } from 'lucide-react';
import { getBillingData, getClients, exportData } from '@/services/mockData';
import { StatCard } from '@/components/ui/StatCard';
import type { BillingData, Client } from '@/types';

/* ─── Revenue bar chart ─────────────────────────────────────────── */
const RevenueChart = ({ data }: { data: BillingData[] }) => {
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-text-main tracking-wide">Ingresos Mensuales</h3>
        <span className="text-[10px] px-2 py-1 rounded-md border border-border bg-background text-text-muted uppercase tracking-wider">
          Últimos 6 meses
        </span>
      </div>
      <div className="space-y-4">
        {data.map((item, i) => {
          const pct = (item.revenue / max) * 100;
          return (
            <motion.div
              key={item.month}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-text-muted">{item.month}</span>
                <span className="font-semibold text-text-main data-mono">${item.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: i * 0.07 + 0.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-primary/80"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── ARPU chart ────────────────────────────────────────────────── */
const ARPUChart = ({ data }: { data: BillingData[] }) => (
  <div>
    <h3 className="text-sm font-semibold text-text-main tracking-wide mb-5">ARPU por Mes</h3>
    <div className="space-y-3">
      {data.map((item, i) => (
        <motion.div
          key={item.month}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex items-center justify-between px-4 py-3 rounded-md bg-background border border-border"
        >
          <div>
            <p className="text-xs text-text-muted">{item.month}</p>
            <p className="text-xl font-bold text-text-main data-mono mt-0.5">
              ${item.averageRevenuePerUser.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-text-muted data-mono">{item.clients} clientes</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

/* ─── Billing Page ──────────────────────────────────────────────── */
export const BillingPage = () => {
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [clients,     setClients]     = useState<Client[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billing, clientsData] = await Promise.all([getBillingData(), getClients()]);
      setBillingData(billing);
      setClients(clientsData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-text-muted text-sm data-mono">cargando finanzas...</span>
    </div>
  );

  const totalRevenue  = billingData.reduce((s, d) => s + d.revenue, 0);
  const avgRevenue    = totalRevenue / billingData.length;
  const current       = billingData[billingData.length - 1];
  const previous      = billingData[billingData.length - 2];
  const growth        = previous ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
  const activeClients = clients.filter(c => c.status === 'active').length;

  const panelClass = 'bg-surface border border-border rounded-lg p-6 rounded-xl overflow-hidden';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Finanzas</h1>
          <p className="text-sm text-text-muted mt-0.5">Análisis de ingresos y facturación</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => exportData('billing').catch(console.error)}
          className="btn-action btn-action-cyan px-4 py-2 text-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Reporte
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ingresos Totales"  value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} variant="primary" subtitle="6 meses" index={0} />
        <StatCard title="Ingreso Promedio"  value={`$${Math.round(avgRevenue).toLocaleString()}`} icon={TrendingUp} variant="success" trend={{ value: growth, isPositive: growth > 0 }} index={1} />
        <StatCard title="Mes Actual"        value={`$${current.revenue.toLocaleString()}`} icon={Calendar}  variant="primary" subtitle={current.month} index={2} />
        <StatCard title="Clientes Activos"  value={`${activeClients}/${clients.length}`} icon={Users}     variant="success" subtitle="Generando ingresos" index={3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className={panelClass}>
          <RevenueChart data={billingData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className={panelClass}>
          <ARPUChart data={billingData} />
        </motion.div>
      </div>

      {/* Breakdown table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={panelClass}>
        <h3 className="text-sm font-semibold text-text-main mb-4 tracking-wide">Desglose de Ingresos</h3>
        <div className="space-y-2">
          {billingData.map((item, i) => (
            <motion.div
              key={item.month}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between px-4 py-3.5 rounded-md bg-background border border-border hover:bg-surface-raised transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/[0.08] border border-primary/15">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-main">{item.month}</p>
                  <p className="text-xs text-text-muted">{item.clients} clientes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-text-main data-mono">${item.revenue.toLocaleString()}</p>
                <p className="text-xs text-text-muted data-mono">ARPU: ${item.averageRevenuePerUser.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
