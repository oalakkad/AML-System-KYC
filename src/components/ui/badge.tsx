import { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.75 text-xs font-semibold ring-1 ring-inset transition-all duration-150',
  {
    variants: {
      tone: {
        slate: 'bg-slate-100/75 text-slate-600 ring-slate-300/40 badge-glow-slate',
        blue: 'bg-blue-50/75 text-blue-700 ring-blue-200/40 badge-glow-blue',
        green: 'bg-emerald-50/75 text-emerald-700 ring-emerald-200/40 badge-glow-green',
        amber: 'bg-amber-50/75 text-amber-700 ring-amber-200/40 badge-glow-amber',
        red: 'bg-red-50/75 text-red-700 ring-red-200/40 badge-glow-red',
        violet: 'bg-violet-50/75 text-violet-700 ring-violet-200/40 badge-glow-violet',
      },
    },
    defaultVariants: { tone: 'slate' },
  },
);

export function Badge({
  tone,
  className,
  children,
}: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}

