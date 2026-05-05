import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Settings2,
  Save, CheckCircle2, Eye, EyeOff,
  Phone, Building2, MapPin, Globe,
  KeyRound, LogOut, Wifi,
} from 'lucide-react';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ─── Sub-components ──────────────────────────────────────────── */

const Field = ({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
      {hint && <span className="text-[10px] text-text-subtle">{hint}</span>}
    </div>
    {children}
  </div>
);

const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      'w-full px-3 py-2 rounded-lg border text-sm transition-colors',
      'bg-surface-input border-border text-text-main placeholder:text-text-subtle',
      'focus:outline-none focus:border-primary/40',
      props.disabled && 'opacity-50 cursor-not-allowed bg-surface',
      props.className,
    )}
  />
);

const Toggle = ({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
    <div className="min-w-0 pr-4 flex-1">
      <p className="text-sm font-medium text-text-main">{label}</p>
      {description && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexShrink: 0,
        width: '42px',
        height: '24px',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
        outline: 'none',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 0.2s ease',
          pointerEvents: 'none',
        }}
      />
    </button>
  </div>
);

const SectionCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-surface border border-border rounded-xl p-6 space-y-4', className)}>
    {children}
  </div>
);

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="pb-1 border-b border-border">
    <h3 className="text-sm font-semibold text-text-main">{title}</h3>
    {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
  </div>
);

/* ─── Tab panels ──────────────────────────────────────────────── */

const AccountTab = ({ userName, userEmail }: { userName: string; userEmail: string }) => {
  const [name,    setName]    = useState(userName);
  const [email,   setEmail]   = useState(userEmail);
  const [showPw,  setShowPw]  = useState(false);
  const [pwForm,  setPwForm]  = useState({ current: '', next: '', confirm: '' });

  const saveProfile = () => toast.success('Perfil actualizado');
  const savePassword = () => {
    if (!pwForm.current) { toast.error('Ingresa tu contraseña actual'); return; }
    if (pwForm.next.length < 8) { toast.error('La nueva contraseña debe tener al menos 8 caracteres'); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    toast.success('Contraseña actualizada');
    setPwForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="space-y-5">
      <SectionCard>
        <SectionTitle title="Información del perfil" subtitle="Tu nombre e email de acceso al sistema" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre">
            <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@nexory.com" />
          </Field>
          <Field label="Rol" hint="No editable">
            <TextInput value="Administrador" disabled />
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={saveProfile} className="btn-action btn-action-cyan px-4 py-2 text-sm">
            <Save className="w-3.5 h-3.5" />Guardar perfil
          </button>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle title="Cambiar contraseña" subtitle="Usa al menos 8 caracteres con letras y números" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Contraseña actual">
            <div className="relative">
              <TextInput
                type={showPw ? 'text' : 'password'}
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                placeholder="••••••••"
                className="pr-9"
              />
              <button
                onClick={() => setShowPw(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
              >
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </Field>
          <Field label="Nueva contraseña">
            <TextInput
              type="password"
              value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirmar contraseña">
            <TextInput
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
            />
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={savePassword} className="btn-action btn-action-ghost px-4 py-2 text-sm border border-border">
            <KeyRound className="w-3.5 h-3.5" />Cambiar contraseña
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

const BusinessTab = () => {
  const [form, setForm] = useState({
    name: 'Nexory',
    nit: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Bogotá',
    website: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <SectionCard>
        <SectionTitle title="Datos del negocio" subtitle="Información que aparece en comunicados y facturas" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre de la empresa">
            <TextInput value={form.name} onChange={set('name')} placeholder="Nexory" />
          </Field>
          <Field label="NIT / RUT" hint="Opcional">
            <TextInput value={form.nit} onChange={set('nit')} placeholder="900.123.456-7" />
          </Field>
          <Field label="Teléfono de contacto">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <TextInput value={form.phone} onChange={set('phone')} placeholder="+57 300 123 4567" className="pl-9" />
            </div>
          </Field>
          <Field label="WhatsApp soporte" hint="Para envío de comunicados">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#25d366] pointer-events-none" />
              <TextInput value={form.whatsapp} onChange={set('whatsapp')} placeholder="+57 300 123 4567" className="pl-9" />
            </div>
          </Field>
          <Field label="Dirección">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <TextInput value={form.address} onChange={set('address')} placeholder="Calle 10 #20-30" className="pl-9" />
            </div>
          </Field>
          <Field label="Ciudad">
            <TextInput value={form.city} onChange={set('city')} placeholder="Bogotá" />
          </Field>
          <Field label="Sitio web" hint="Opcional">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <TextInput value={form.website} onChange={set('website')} placeholder="https://nexory.com" className="pl-9" />
            </div>
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={() => toast.success('Datos de empresa guardados')} className="btn-action btn-action-cyan px-4 py-2 text-sm">
            <Save className="w-3.5 h-3.5" />Guardar
          </button>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle title="Integración WhatsApp" subtitle="Conexión con WAHA para envío de mensajes" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="URL del servidor WAHA">
            <div className="relative">
              <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <TextInput placeholder="http://localhost:3000" className="pl-9 font-mono text-xs" />
            </div>
          </Field>
          <Field label="API Key" hint="Secreto">
            <TextInput type="password" placeholder="waha_xxxxxxxxxxxxx" className="font-mono text-xs" />
          </Field>
        </div>
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => toast.info('Verificando conexión...')} className="btn-action btn-action-ghost px-3 py-1.5 text-sm border border-border">
            Probar conexión
          </button>
          <button onClick={() => toast.success('Configuración guardada')} className="btn-action btn-action-cyan px-4 py-2 text-sm">
            <Save className="w-3.5 h-3.5" />Guardar
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

const NotificationsTab = () => {
  const [notif, setNotif] = useState({
    emailPayment:    true,
    emailSuspension: true,
    emailTickets:    false,
    whatsappPayment: true,
    whatsappAlerts:  false,
  });
  const toggle = (k: keyof typeof notif) => setNotif(f => ({ ...f, [k]: !f[k] }));

  return (
    <div className="space-y-5">
      <SectionCard>
        <SectionTitle title="Email" subtitle="Notificaciones que recibirás en tu correo electrónico" />
        <Toggle label="Recordatorios de pago" description="Aviso cuando un cliente está próximo a vencer" checked={notif.emailPayment} onChange={() => toggle('emailPayment')} />
        <Toggle label="Avisos de suspensión" description="Cuando un corte se ejecuta automáticamente" checked={notif.emailSuspension} onChange={() => toggle('emailSuspension')} />
        <Toggle label="Nuevos tickets" description="Cada vez que se abre un ticket de soporte técnico" checked={notif.emailTickets} onChange={() => toggle('emailTickets')} />
      </SectionCard>

      <SectionCard>
        <SectionTitle title="WhatsApp" subtitle="Notificaciones que recibirás por WhatsApp" />
        <Toggle label="Pagos recibidos" description="Confirmación cuando un cliente registra su pago" checked={notif.whatsappPayment} onChange={() => toggle('whatsappPayment')} />
        <Toggle label="Alertas del sistema" description="Fallos de conexión, errores críticos" checked={notif.whatsappAlerts} onChange={() => toggle('whatsappAlerts')} />
      </SectionCard>
    </div>
  );
};

const SystemTab = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [tz,    setTz]    = useState('America/Bogota');

  const themes = [
    { value: 'light' as const, label: 'Claro' },
    { value: 'dark'  as const, label: 'Oscuro' },
    { value: 'auto'  as const, label: 'Sistema' },
  ];

  return (
    <div className="space-y-5">
      <SectionCard>
        <SectionTitle title="Apariencia" subtitle="Tema visual del sistema" />
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Tema</label>
          <SegmentControl segments={themes} value={theme} onChange={setTheme} />
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle title="Regional" subtitle="Zona horaria para mostrar fechas y horas" />
        <Field label="Zona horaria">
          <select
            value={tz}
            onChange={e => setTz(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-surface-input text-text-main focus:outline-none focus:border-primary/40"
          >
            <option value="America/Bogota">América/Bogotá (GMT-5)</option>
            <option value="America/Mexico_City">América/Ciudad de México (GMT-6)</option>
            <option value="America/Santiago">América/Santiago (GMT-3)</option>
            <option value="America/Lima">América/Lima (GMT-5)</option>
          </select>
        </Field>
        <div className="flex justify-end pt-2">
          <button onClick={() => toast.success('Preferencias guardadas')} className="btn-action btn-action-cyan px-4 py-2 text-sm">
            <Save className="w-3.5 h-3.5" />Guardar
          </button>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle title="Acerca del sistema" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Versión</span>
              <span className="text-xs font-semibold text-text-main font-mono">1.0.0-beta</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20 text-warning font-semibold">Beta</span>
            </div>
            <p className="text-[11px] text-text-subtle">Nexory ISP Management · {new Date().getFullYear()}</p>
          </div>
          <Tooltip content="Cerrar sesión en este dispositivo" side="left">
            <button
              onClick={() => toast.info('Cerrando sesión...')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-danger/20 text-danger bg-danger/[0.04] hover:bg-danger/[0.10] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </Tooltip>
        </div>
      </SectionCard>
    </div>
  );
};

/* ─── Page ────────────────────────────────────────────────────── */

type Tab = 'account' | 'business' | 'notifications' | 'system';

const TABS = [
  { value: 'account'       as Tab, label: 'Mi Cuenta',       icon: User       },
  { value: 'business'      as Tab, label: 'Empresa',         icon: Building2  },
  { value: 'notifications' as Tab, label: 'Notificaciones',  icon: Bell       },
  { value: 'system'        as Tab, label: 'Sistema',         icon: Settings2  },
];

export const SettingsPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('account');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Configuración</h1>
        <p className="text-sm text-text-muted mt-0.5">Administra tu cuenta y las preferencias del sistema</p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text-main',
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {isActive && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'account'       && <AccountTab userName={user?.name ?? 'Administrador'} userEmail={user?.email ?? ''} />}
          {tab === 'business'      && <BusinessTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'system'        && <SystemTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
