// Single source of truth for the 6 canonical entity-status tones (risk
// ratings, case statuses, alert severities, audit-log actions, etc). Badge,
// StatCard, and AuditTimeline previously each hardcoded their own copy of
// this palette — a hue change meant editing 3+ files and they'd drift out
// of sync. Everything that colors an entity by "tone" should import from
// here instead of hardcoding Tailwind classes directly.

export const TONES = ['slate', 'blue', 'green', 'amber', 'red', 'violet'] as const;
export type Tone = (typeof TONES)[number];

/** Badge pill background/text/ring (with the glow utility from globals.css). */
export const TONE_BADGE: Record<Tone, string> = {
  slate: 'bg-slate-100/75 text-slate-600 ring-slate-300/40 badge-glow-slate',
  blue: 'bg-blue-50/75 text-blue-700 ring-blue-200/40 badge-glow-blue',
  green: 'bg-emerald-50/75 text-emerald-700 ring-emerald-200/40 badge-glow-green',
  amber: 'bg-amber-50/75 text-amber-700 ring-amber-200/40 badge-glow-amber',
  red: 'bg-red-50/75 text-red-700 ring-red-200/40 badge-glow-red',
  violet: 'bg-violet-50/75 text-violet-700 ring-violet-200/40 badge-glow-violet',
};

/** Square/rounded icon-chip background + text (StatCard, Settings role tiles, etc). */
export const TONE_CHIP: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
};

/** Solid dot/legend-swatch color, default weight. */
export const TONE_DOT: Record<Tone, string> = {
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
};

/** Solid dot, one shade darker — used where a component needs to visually
 * distinguish two entries of the same tone (e.g. AuditTimeline's
 * compliance-level vs manager-level approve/reject). */
export const TONE_DOT_STRONG: Record<Tone, string> = {
  slate: 'bg-slate-500',
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  amber: 'bg-amber-600',
  red: 'bg-red-600',
  violet: 'bg-violet-600',
};

/** Top/start accent-border color (CRA band cards, threshold rows, etc). */
export const TONE_BORDER_T: Record<Tone, string> = {
  slate: 'border-t-slate-400',
  blue: 'border-t-blue-500',
  green: 'border-t-emerald-500',
  amber: 'border-t-amber-500',
  red: 'border-t-red-500',
  violet: 'border-t-violet-500',
};
