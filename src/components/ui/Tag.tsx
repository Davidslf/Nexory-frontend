import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TagProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
  className?: string;
}

const variantClasses: Record<NonNullable<TagProps['variant']>, string> = {
  default: 'bg-surface border-border text-text-muted',
  primary: 'badge-active',
  success: 'badge-active',
  warning: 'badge-pending',
  danger:  'badge-suspended',
  info:    'badge-inprogress',
};

const sizeClasses: Record<NonNullable<TagProps['size']>, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export const Tag = ({
  label,
  variant = 'default',
  size = 'md',
  onRemove,
  className,
}: TagProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 rounded-full p-0.5 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
