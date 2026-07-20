import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_BADGE, type Tone } from '@/lib/theme/tones';

export function Badge({
  tone = 'slate',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.75 text-xs font-bold ring-1 ring-inset transition-all duration-150',
        TONE_BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

