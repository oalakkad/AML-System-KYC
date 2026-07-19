import { type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('flex items-start gap-3 rounded-md border p-4 text-sm', {
  variants: {
    tone: {
      info: 'border-blue-200 bg-blue-50 text-blue-900',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      warning: 'border-amber-200 bg-amber-50 text-amber-900',
      danger: 'border-red-200 bg-red-50 text-red-900',
    },
  },
  defaultVariants: { tone: 'info' },
});

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const;

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: VariantProps<typeof alertVariants> & {
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = icons[tone ?? 'info'];
  return (
    <div className={cn(alertVariants({ tone }), className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-1')}>{children}</div>}
      </div>
    </div>
  );
}
