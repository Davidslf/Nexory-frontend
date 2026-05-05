import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface PillProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<PillProps['variant']>, string> = {
  default: 'bg-surface border-border text-text-muted',
  primary: 'badge-active',
  success: 'badge-active',
  warning: 'badge-pending',
  danger:  'badge-suspended',
};

export const Pill = ({
  label,
  value,
  variant = 'default',
  icon,
  className,
}: PillProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-text-muted">{label}:</span>
      <span className="font-semibold data-mono">{value}</span>
    </motion.div>
  );
};
