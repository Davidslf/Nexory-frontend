import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, User, AlertTriangle, ArrowRight, ListChecks } from 'lucide-react';
import { apiGetTasks, apiCompleteTask } from '@/services/api';
import type { Task } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

type TabFilter = 'all' | 'pending' | 'completed';

const PRIORITY_LABEL: Record<string, string> = { urgent: 'Urgente', high: 'Alta', normal: 'Normal' };
const TYPE_LABEL: Record<string, string> = {
  suspend_client: 'Suspensión',
  assign_ticket:  'Soporte',
  review_message: 'Mensaje',
  follow_up:      'Seguimiento',
};

const priorityClass = (p: string) =>
  p === 'urgent' ? 'task-urgent' : p === 'high' ? 'task-high' : 'task-normal';

const priorityDotColor = (p: string) =>
  p === 'urgent' ? 'bg-danger' : p === 'high' ? 'bg-warning' : 'bg-border-strong';

const isOverdue = (dueDate: string, completed: boolean) =>
  !completed && new Date(dueDate) < new Date();

export const TasksPage = () => {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<TabFilter>('pending');
  const [completing, setCompleting] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await apiGetTasks() as any[];
      const mapped: Task[] = data.map((t: any) => ({
        ...t,
        id: t.id,
        priority: (t.priority as string)?.toLowerCase() as Task['priority'] ?? 'normal',
        type: (t.type as string) ?? 'follow_up',
        completed: t.status === 'COMPLETED',
        completedAt: t.completedAt ?? undefined,
        dueDate: t.dueDate ?? t.createdAt,
      }));
      setTasks(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      await apiCompleteTask(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t));
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(null);
    }
  };

  const filtered = tasks.filter(t => {
    if (tab === 'pending')   return !t.completed;
    if (tab === 'completed') return t.completed;
    return true;
  });

  const urgentCount    = tasks.filter(t => !t.completed && t.priority === 'urgent').length;
  const highCount      = tasks.filter(t => !t.completed && t.priority === 'high').length;
  const completedToday = tasks.filter(t => t.completed && t.completedAt &&
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-text-muted text-sm data-mono">cargando tareas...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Stat Row ── */}
      <div className="grid grid-cols-3 border border-border rounded-xl overflow-hidden mb-6 bg-surface">
        <div className="stat-block">
          <span className="stat-block-label">Urgentes</span>
          <span className="stat-block-value" style={{ color: urgentCount > 0 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
            {urgentCount}
          </span>
          <span className="stat-block-trend">Requieren acción hoy</span>
        </div>
        <div className="stat-block">
          <span className="stat-block-label">Alta Prioridad</span>
          <span className="stat-block-value" style={{ color: highCount > 0 ? 'var(--color-warning)' : 'var(--color-text-main)' }}>
            {highCount}
          </span>
          <span className="stat-block-trend">Pendientes</span>
        </div>
        <div className="stat-block">
          <span className="stat-block-label">Completadas Hoy</span>
          <span className="stat-block-value" style={{ color: 'var(--color-success)' }}>
            {completedToday}
          </span>
          <span className="stat-block-trend">Tareas resueltas</span>
        </div>
      </div>

      {/* ── Tabs + Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded">
          {(['pending', 'all', 'completed'] as TabFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded transition-colors',
                tab === t
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text-main'
              )}
            >
              {t === 'pending' ? 'Pendientes' : t === 'all' ? 'Todas' : 'Completadas'}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted data-mono">
          {filtered.length} tarea{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Task List ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ListChecks className="w-8 h-8 text-text-subtle" />
            <span className="text-sm text-text-muted">
              {tab === 'pending' ? 'Sin tareas pendientes' : 'Sin tareas en esta categoría'}
            </span>
          </div>
        ) : (
          <table className="line-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Tarea</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Vencimiento</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((task, i) => {
                  const overdue = isOverdue(task.dueDate, task.completed);
                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(priorityClass(task.priority), task.completed ? 'opacity-50' : '')}
                    >
                      <td>
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${priorityDotColor(task.priority)}`} />
                          <div>
                            <p className={cn('text-sm font-semibold text-text-main', task.completed && 'line-through')}>
                              {task.title}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{task.description}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {task.clientName ? (
                          <span className="flex items-center gap-1.5 text-xs text-text-muted">
                            <User className="w-3 h-3" />
                            {task.clientName}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-border text-text-muted data-mono">
                          {TYPE_LABEL[task.type] ?? task.type}
                        </span>
                      </td>
                      <td>
                        <span className={cn('flex items-center gap-1 text-xs data-mono', overdue ? 'text-danger font-semibold' : 'text-text-muted')}>
                          {overdue && <AlertTriangle className="w-3 h-3" />}
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'd MMM', { locale: es })}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2">
                          {!task.completed && (
                            <button
                              onClick={() => handleComplete(task.id)}
                              disabled={completing === task.id}
                              className="btn-action btn-action-success"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {completing === task.id ? 'Completando...' : 'Completar'}
                            </button>
                          )}
                          {task.clientId && (
                            <button
                              onClick={() => navigate('/clients')}
                              className="btn-action btn-action-ghost"
                            >
                              Ver cliente
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};
