import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiLoginStep1, apiLoginStep2 } from '@/services/api';
import {
  LogIn, Lock, Shield, AlertCircle, Eye, EyeOff,
  MessageSquare, ArrowLeft, User as UserIcon, CheckCircle2,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

/* ── Typewriter wordmark ─────────────────────────────────────────── */
const WORD = 'NEXORY';

const TypewriterWordmark = () => {
  const [visible, setVisible] = useState(0);   // how many letters shown
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (visible < WORD.length) {
      const t = setTimeout(() => setVisible(v => v + 1), 90);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Blink cursor after typing is done
  useEffect(() => {
    if (visible < WORD.length) return;
    const t = setInterval(() => setShowCursor(s => !s), 530);
    return () => clearInterval(t);
  }, [visible]);

  return (
    <div className="flex items-end mb-2" aria-label="NEXORY">
      {WORD.split('').map((letter, i) => (
        <span
          key={i}
          className="text-[72px] font-black leading-none tracking-[-0.03em] select-none transition-all"
          style={{
            fontFamily: "'Syne', sans-serif",
            color: i < visible ? 'rgba(255,255,255,0.90)' : 'transparent',
            transition: 'color 0.05s',
          }}
        >
          {letter}
        </span>
      ))}
      {/* Cursor */}
      <span
        className="text-[72px] font-black leading-none ml-1 select-none"
        style={{
          fontFamily: "'Syne', sans-serif",
          color: showCursor ? 'rgba(0,217,255,0.85)' : 'transparent',
          transition: 'color 0.08s',
        }}
      >
        |
      </span>
    </div>
  );
};

type Step = 'credentials' | 'otp';

const slide = {
  enter:  (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:   (dir: number) => ({ opacity: 0, x: dir * -40, transition: { duration: 0.22 } }),
};

export const LoginPage = () => {
  const [step,         setStep]         = useState<Step>('credentials');
  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [otp,          setOtp]          = useState(['', '', '', '', '', '']);
  const [userId,       setUserId]       = useState('');
  const [phoneMasked,  setPhoneMasked]  = useState('');
  const [devCode,      setDevCode]      = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [focused,      setFocused]      = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  // Auto-foco en primer campo OTP al entrar al paso 2
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 350);
    }
  }, [step]);

  // Auto-submit cuando los 6 dígitos están completos
  useEffect(() => {
    if (otp.every(d => d !== '') && step === 'otp') {
      handleVerifyOtp();
    }
  }, [otp]);

  const inputClass = (field: string) =>
    `w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all bg-white/[0.04] border ${
      focused === field
        ? 'border-cyan/40 text-white/80 bg-white/[0.06]'
        : 'border-white/[0.08] text-white/60'
    } placeholder:text-white/18 focus:outline-none`;

  // ── Paso 1: usuario + contraseña ──────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLoginStep1(username, password);
      setUserId(res.userId);
      setPhoneMasked(res.phoneMasked || '');
      if (res.devCode) setDevCode(res.devCode);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: verificar OTP ────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiLoginStep2(userId, code);
      setSession(res.token, {
        id:    res.user.id,
        name:  res.user.name,
        email: res.user.email,
        role:  res.user.role as 'admin' | 'operator',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError('Código incorrecto o expirado');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(''));
    }
  };

  return (
    <div data-theme="dark" className="min-h-screen bg-background dot-grid flex">

      {/* ── Panel izquierdo ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-between p-12
                   bg-[#08090d] border-r border-white/[0.05]"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,217,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,217,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-cyan/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/5 w-64 h-64 bg-blue-700/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative z-10 flex flex-col h-full">
          {/* ── Wordmark animado ─────────────────────────────────── */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Logo con efecto coin flip */}
            <div className="mb-8" style={{ perspective: '600px' }}>
              <motion.img
                src="/images/NEXORY-CIRULO.png"
                alt="NEXORY"
                width={96}
                height={96}
                initial={{ rotateY: 0, opacity: 0, scale: 0.6 }}
                animate={{
                  rotateY: [0, 360],
                  opacity: 1,
                  scale:   1,
                }}
                transition={{
                  rotateY: {
                    duration: 2.2,
                    ease: 'linear',
                    repeat: Infinity,
                    repeatType: 'loop',
                    delay: 0.4,
                  },
                  opacity: { duration: 0.5 },
                  scale:   { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{ display: 'block', transformStyle: 'preserve-3d' }}
                className="object-contain"
              />
            </div>

            {/* NEXORY typewriter */}
            <TypewriterWordmark />

            {/* Línea cyan que se dibuja */}
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.65, duration: 0.6, ease: 'easeOut' }}
              className="h-[2px] w-full mb-6"
              style={{ background: 'linear-gradient(90deg, rgba(0,217,255,0.8) 0%, rgba(0,217,255,0.1) 100%)' }}
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-sm text-white/35 leading-relaxed max-w-xs mb-10"
            >
              Gestión centralizada de clientes, routers y soporte para proveedores de internet.
            </motion.p>

            {/* Métricas animadas */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '99.8', unit: '%', label: 'Uptime' },
                { value: '1.2',  unit: 'ms', label: 'Latencia' },
                { value: '247',  unit: '',   label: 'Clientes' },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + i * 0.12, duration: 0.45 }}
                  className="px-3 py-3 border border-white/[0.06] bg-white/[0.025]"
                  style={{ borderRadius: '4px' }}
                >
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span
                      className="text-2xl font-black leading-none"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,217,255,0.85)' }}
                    >
                      {m.value}
                    </span>
                    {m.unit && (
                      <span className="text-xs text-white/30 font-semibold">{m.unit}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">{m.label}</span>
                  {/* Pulse dot */}
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
                    className="w-1 h-1 rounded-full bg-cyan/50 mt-2"
                  />
                </motion.div>
              ))}
            </div>

            {/* 2FA notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-8 flex items-start gap-3 px-4 py-3 border border-cyan/10 bg-cyan/[0.04]"
              style={{ borderRadius: '4px' }}
            >
              <MessageSquare className="w-4 h-4 text-cyan/60 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/35 leading-relaxed">
                Verificación en 2 pasos activada. Recibirás un código de 6 dígitos por <span className="text-cyan/60">WhatsApp</span>.
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="relative z-10 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
          <span className="text-[11px] text-white/22 data-mono">Sistema operativo · v1.0.0</span>
        </motion.div>
      </motion.div>

      {/* ── Panel derecho — formulario ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-hidden">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Logo size={28} variant="full" showText={false} />
            <span className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Nexory</span>
          </div>

          <AnimatePresence mode="wait" custom={step === 'otp' ? 1 : -1}>

            {/* ── PASO 1: credenciales ── */}
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                custom={-1}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white/85 mb-1">Iniciar sesión</h2>
                  <p className="text-sm text-white/30">Accede a tu panel de control</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-4">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-danger/8 border border-danger/20 text-danger text-sm"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-white/38 mb-1.5 uppercase tracking-wider">
                      Usuario
                    </label>
                    <div className="relative">
                      <UserIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === 'username' ? 'text-cyan/60' : 'text-white/20'}`} />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onFocus={() => setFocused('username')}
                        onBlur={() => setFocused(null)}
                        className={inputClass('username')}
                        placeholder="admin"
                        autoComplete="username"
                        required
                        disabled={loading}
                      />
                      {username && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success/70" />}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-white/38 mb-1.5 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === 'password' ? 'text-cyan/60' : 'text-white/20'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        className={`${inputClass('password')} pr-10`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/22 hover:text-white/50 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading || !username || !password}
                    whileHover={{ scale: loading ? 1 : 1.015 }}
                    whileTap={{ scale: loading ? 1 : 0.975 }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2
                      ${loading || !username || !password
                        ? 'bg-white/[0.05] text-white/25 cursor-not-allowed border border-white/[0.06]'
                        : 'gradient-nexory text-white glow-cyan border border-transparent'
                      }`}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Continuar
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── PASO 2: código OTP ── */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                custom={1}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Back */}
                <button
                  onClick={() => { setStep('credentials'); setError(''); setOtp(['','','','','','']); }}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-8"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver
                </button>

                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-cyan/70" />
                  </div>
                  <h2 className="text-xl font-bold text-white/85 mb-1">Verifica tu identidad</h2>
                  <p className="text-sm text-white/35 leading-relaxed">
                    Ingresa el código de 6 dígitos enviado por WhatsApp
                    {phoneMasked && <> al número <span className="text-white/55 data-mono">{phoneMasked}</span></>}
                  </p>

                  {/* Dev mode hint */}
                  {devCode && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 px-3 py-2 rounded-lg bg-warning/8 border border-warning/20 flex items-center gap-2"
                    >
                      <span className="text-[10px] font-bold text-warning/70 uppercase tracking-wider">Dev</span>
                      <span className="text-sm text-warning/80 data-mono font-bold tracking-widest">{devCode}</span>
                    </motion.div>
                  )}
                </div>

                {/* OTP inputs */}
                <div className="flex gap-2 mb-6 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <motion.input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      disabled={loading}
                      className={`
                        w-11 h-12 text-center text-lg font-bold rounded border transition-all
                        focus:outline-none caret-transparent
                        ${digit
                          ? 'border-cyan/50 bg-cyan/[0.08] text-white'
                          : 'border-white/[0.10] bg-white/[0.03] text-white/40'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'focus:border-cyan/60 focus:bg-cyan/[0.10]'}
                      `}
                    />
                  ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-danger/8 border border-danger/20 text-danger text-sm mb-4"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit manual */}
                <motion.button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.some(d => !d)}
                  whileHover={{ scale: loading ? 1 : 1.015 }}
                  whileTap={{ scale: loading ? 1 : 0.975 }}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
                    ${loading || otp.some(d => !d)
                      ? 'bg-white/[0.05] text-white/25 cursor-not-allowed border border-white/[0.06]'
                      : 'gradient-nexory text-white glow-cyan border border-transparent'
                    }`}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Verificar y acceder
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-white/20 mt-4">
                  El código expira en 5 minutos
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center justify-center gap-2 text-[11px] text-white/18"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Conexión segura · 2FA activo</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
