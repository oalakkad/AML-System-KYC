'use client';

// Icon + label card that toggles between a small set of options (client
// type, form type, etc). Was duplicated identically twice in new-case-form.tsx
// — one shared component instead.

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SelectableCard({
  selected,
  icon: Icon,
  label,
  onClick,
}: {
  selected: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
        selected
          ? 'border-primary/40 bg-primary-soft text-primary shadow-sm'
          : 'border-hairline bg-white text-muted hover:border-hairline-strong hover:text-ink',
      )}
    >
      <Icon className="size-6" aria-hidden />
      {label}
    </button>
  );
}
