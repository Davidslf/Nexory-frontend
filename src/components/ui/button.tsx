import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:     'bg-primary text-white hover:bg-primary-active shadow-sm focus-visible:ring-primary active:scale-95',
        destructive: 'bg-danger text-white hover:bg-danger/90 shadow-sm focus-visible:ring-danger active:scale-95',
        outline:     'border border-border bg-transparent hover:bg-surface-raised text-text-main focus-visible:ring-primary',
        secondary:   'bg-surface-raised text-text-main hover:bg-border/30 focus-visible:ring-primary border border-border',
        ghost:       'hover:bg-surface-raised text-text-muted hover:text-text-main',
        link:        'text-primary underline-offset-4 hover:underline p-0 h-auto',
        cyan:        'bg-primary text-white hover:bg-primary-active shadow-sm focus-visible:ring-primary active:scale-95',
        warning:     'bg-warning text-white hover:bg-warning/90 shadow-sm active:scale-95',
        success:     'bg-success text-white hover:bg-success/90 shadow-sm active:scale-95',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-11 px-6 text-base',
        icon:    'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
