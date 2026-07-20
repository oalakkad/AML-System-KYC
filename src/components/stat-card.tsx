import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_CHIP, TONE_DOT, type Tone } from '@/lib/theme/tones';

export interface StatBreakdownRow {
  label: string;
  value: number;
  tone?: Tone;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  breakdown,
  breakdownTitle,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  /** Shown in a hover/focus popover — a same-total decomposition of `value` (e.g. by risk rating). */
  breakdown?: StatBreakdownRow[];
  breakdownTitle?: string;
}) {
  const hasBreakdown = breakdown && breakdown.length > 0;

  return (
    <div
      className="group relative flex items-center gap-4 rounded-xl border border-hairline bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-raised focus-within:-translate-y-0.5 focus-within:border-hairline-strong focus-within:shadow-raised"
      tabIndex={hasBreakdown ? 0 : undefined}
    >
      <span className={cn('flex size-14 shrink-0 items-center justify-center rounded-lg', TONE_CHIP[tone])}>
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-3xl font-black tnum text-ink">{value}</p>
        <p className="text-base font-medium leading-snug text-muted">{label}</p>
      </div>

      {hasBreakdown && (
        <div
          className="pointer-events-none absolute start-4 top-full z-20 mt-2 w-56 origin-top-left scale-95 rounded-lg border border-hairline bg-card p-3 opacity-0 shadow-pop transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100"
          role="tooltip"
        >
          {breakdownTitle && (
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-faint">{breakdownTitle}</p>
          )}
          <ul className="space-y-1.5">
            {breakdown.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted">
                  <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT[row.tone ?? 'slate'])} aria-hidden />
                  {row.label}
                </span>
                <span className="font-semibold tnum text-ink">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
