import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'square' | 'circle';
  className?: string;
}

// Logo principal con texto
export const Logo = ({ 
  size = 40, 
  showText = false, 
  variant = 'full',
  className = '' 
}: LogoProps) => {
  const logoImage = variant === 'square' 
    ? '/images/NEXORY-CUADRO.png'
    : variant === 'circle'
    ? '/images/NEXORY-CIRULO.png'
    : '/images/NEXORY-LOGO-LETRAS.png';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.img
        src={logoImage}
        alt="NEXORY Logo"
        width={size}
        height={size}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="flex-shrink-0 object-contain"
        style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
      />
      {showText && variant === 'full' && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-extrabold text-gradient-nexory"
        >
          NEXORY
        </motion.span>
      )}
    </div>
  );
};

// Logo circular para iconos
export const LogoIcon = ({ 
  size = 32, 
  className = '' 
}: { 
  size?: number; 
  className?: string;
}) => {
  return (
    <motion.img
      src="/images/NEXORY-CIRULO.png"
      alt="NEXORY Icon"
      width={size}
      height={size}
      className={`flex-shrink-0 object-contain ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', duration: 0.6 }}
      style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
    />
  );
};

// Logo cuadrado para favicon o uso específico
export const LogoSquare = ({ 
  size = 40, 
  className = '' 
}: { 
  size?: number; 
  className?: string;
}) => {
  return (
    <motion.img
      src="/images/NEXORY-CUADRO.png"
      alt="NEXORY Square Logo"
      width={size}
      height={size}
      className={`flex-shrink-0 object-contain ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.6 }}
      style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
    />
  );
};
