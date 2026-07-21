'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-primary to-accent text-white shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/35 hover:-translate-y-px',
        secondary: 'border border-hairline-strong bg-card text-ink hover:bg-subtle hover:border-hairline-strong shadow-sm hover:shadow-md/20',
        ghost: 'text-muted hover:bg-subtle hover:text-ink',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md hover:shadow-emerald-600/10',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md hover:shadow-red-600/10',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md hover:shadow-amber-500/10',
      },
      size: {
        sm: 'h-9.5 px-3.5 text-[13px] tracking-wide',
        md: 'h-11 px-4.5 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

