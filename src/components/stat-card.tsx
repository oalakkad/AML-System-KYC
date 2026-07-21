import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_CHIP, TONE_DOT, type Tone } from '@/lib/theme/tones';

export interface StatBreakdownRow {
  label: string;
  value: number;
  tone?: Tone;
}

// SVG stroke color per tone (SVG can't use the Tailwind bg-* classes TONE_DOT
// gives) — reads the same --tone-* CSS vars as tones.ts so sparklines stay
// correctly hued across Midnight/Azure.
const SPARK_STROKE: Record<Tone, string> = {
  slate: 'var(--tone-slate)',
  blue: 'var(--tone-blue)',
  green: 'var(--tone-green)',
  amber: 'var(--tone-amber)',
  red: 'var(--tone-red)',
  violet: 'var(--tone-violet)',
};

/** Tiny inline trend line from a series of counts (e.g. the 14-day case trend). */
function Sparkline({ data, tone }: { data: number[]; tone: Tone }) {
  if (data.length < 2) return null;
  const w = 62;
  const h = 26;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 2 - ((v - min) / range) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={SPARK_STROKE[tone]}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  breakdown,
  breakdownTitle,
  spark,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  /** Shown in a hover/focus popover — a same-total decomposition of `value` (e.g. by risk rating). */
  breakdown?: StatBreakdownRow[];
  breakdownTitle?: string;
  /** Optional real trend series rendered as a top-right sparkline. */
  spark?: number[];
}) {
  const hasBreakdown = breakdown && breakdown.length > 0;

  return (
    <div
      className="group relative rounded-2xl border border-hairline bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-raised focus-within:-translate-y-0.5 focus-within:border-hairline-strong focus-within:shadow-raised"
      tabIndex={hasBreakdown ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', TONE_CHIP[tone])}>
          <Icon className="size-4.5" aria-hidden />
        </span>
        {spark && <Sparkline data={spark} tone={tone} />}
      </div>

      <p className="mt-4 text-[32px] font-extrabold leading-none tracking-tight tnum text-ink">{value}</p>
      <p className="mt-1.5 text-[15px] font-semibold text-muted">{label}</p>

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
