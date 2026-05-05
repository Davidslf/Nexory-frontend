import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary/10 text-primary border border-primary/20',
        secondary:   'bg-surface-raised text-text-muted border border-border',
        success:     'bg-success/10 text-success border border-success/20',
        warning:     'bg-warning/10 text-warning border border-warning/20',
        danger:      'bg-danger/10 text-danger border border-danger/20',
        cyan:        'bg-primary/10 text-primary border border-primary/20',
        outline:     'border border-border text-text-muted bg-transparent',
        active:      'bg-success/10 text-success border border-success/20',
        suspended:   'bg-danger/10 text-danger border border-danger/20',
        overdue:     'bg-warning/10 text-warning border border-warning/20',
        paid:        'bg-success/10 text-success border border-success/20',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
