import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ElementType;
}

interface SegmentControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentControl<T extends string>({
  segments, value, onChange, className, size = 'md',
}: SegmentControlProps<T>) {
  const isSm = size === 'sm';
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg bg-surface-raised border border-border',
        isSm ? 'p-0.5 gap-0' : 'p-1 gap-0',
        className,
      )}
    >
      {segments.map((seg) => {
        const isActive = seg.value === value;
        const Icon = seg.icon;
        return (
          <button
            key={seg.value}
            onClick={() => onChange(seg.value)}
            className={cn(
              'relative flex items-center gap-1.5 rounded-md font-semibold transition-colors',
              isSm ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              isActive ? 'text-text-main' : 'text-text-muted hover:text-text-main',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="segment-bg"
                className="absolute inset-0 bg-surface border border-border rounded-md shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {Icon && <Icon className={cn(isSm ? 'w-3 h-3' : 'w-3.5 h-3.5')} />}
              {seg.label}
              {seg.count !== undefined && (
                <span className={cn(
                  'font-mono',
                  isActive ? 'text-text-muted' : 'text-text-subtle/60',
                )}>
                  {seg.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
