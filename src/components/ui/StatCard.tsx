import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  index?: number;
  className?: string;
}

const iconColors: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'text-text-subtle',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
};

const borderColors: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'border-border',
  primary: 'border-primary/20',
  success: 'border-success/20',
  warning: 'border-warning/20',
  danger:  'border-danger/20',
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = 'default',
  index = 0,
  className,
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      whileHover={{ y: -3, transition: { duration: 0.13 } }}
      className={cn(
        'relative rounded-xl border p-5 group transition-all cursor-default',
        'bg-surface hover:bg-surface-raised',
        'shadow-[rgba(0,0,0,0.04)_0px_4px_18px,rgba(0,0,0,0.027)_0px_2px_7.85px,rgba(0,0,0,0.02)_0px_0.8px_2.93px] hover:shadow-[rgba(0,0,0,0.07)_0px_8px_28px,rgba(0,0,0,0.04)_0px_3px_10px]',
        borderColors[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-text-muted uppercase mb-2.5">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-[26px] font-bold leading-none text-text-main data-mono">
              {value}
            </p>
            {trend && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.07 + 0.18 }}
                className={cn(
                  'flex items-center gap-0.5 text-[11px] font-medium data-mono',
                  trend.isPositive ? 'text-success' : 'text-danger'
                )}
              >
                {trend.isPositive
                  ? <TrendingUp  className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend.value)}%
              </motion.span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-text-subtle mt-1.5">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'p-2.5 rounded-md border border-border bg-surface-raised transition-colors',
            'group-hover:border-border-strong',
            iconColors[variant]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
