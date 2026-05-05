import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, CheckCheck, AlertCircle, Wrench,
  WifiOff, CreditCard, AlertTriangle,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notification } from '@/types';

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'support_new':
    case 'support_urgent':  return Wrench;
    case 'client_suspended': return AlertCircle;
    case 'router_offline':  return WifiOff;
    case 'payment_due':     return CreditCard;
    case 'system_alert':    return AlertTriangle;
    default:                return Bell;
  }
};

const severityClass = (s?: Notification['severity']) => {
  switch (s) {
    case 'error':   return 'notif-error';
    case 'warning': return 'notif-warning';
    case 'success': return 'notif-success';
    default:        return 'notif-default';
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onNavigate: (link?: string) => void;
}) => {
  const Icon = getIcon(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onClick={() => {
        if (!notification.read) onMarkAsRead(notification.id);
        if (notification.link) onNavigate(notification.link);
      }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors',
        'hover:bg-surface-raised',
        notification.read ? 'opacity-60' : ''
      )}
    >
      <div className={`mt-0.5 p-1.5 rounded-md border flex-shrink-0 ${severityClass(notification.severity)}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-semibold text-text-main line-clamp-1">{notification.title}</h4>
          {!notification.read && (
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-text-muted/70 mt-1 data-mono">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: es })}
        </p>
      </div>
    </motion.div>
  );
};

// cn helper local (avoids import issues)
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-text-muted hover:text-text-main hover:bg-surface transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 data-mono">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 flex flex-col overflow-hidden max-h-[420px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised">
                <h3 className="text-xs font-semibold text-text-main uppercase tracking-wider">
                  Notificaciones
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-main transition-colors"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Marcar todas
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-0.5 text-text-muted hover:text-text-main transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-7 h-7 mx-auto mb-2 text-text-muted/40" />
                    <p className="text-xs text-text-muted">Sin notificaciones</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {notifications.map(n => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onMarkAsRead={markAsRead}
                        onNavigate={(link) => { setIsOpen(false); if (link) navigate(link); }}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border bg-surface-raised text-center">
                  <button
                    onClick={() => { setIsOpen(false); navigate('/support'); }}
                    className="text-[11px] text-text-muted hover:text-text-main transition-colors"
                  >
                    Ver todas las notificaciones →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
