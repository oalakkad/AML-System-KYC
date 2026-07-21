// Single source of truth for the 6 canonical entity-status tones (risk
// ratings, case statuses, alert severities, audit-log actions, etc). Badge,
// StatCard, and AuditTimeline previously each hardcoded their own copy of
// this palette — a hue change meant editing 3+ files and they'd drift out
// of sync. Everything that colors an entity by "tone" should import from
// here instead of hardcoding Tailwind classes directly.
//
// Every class below resolves through the --tone-* CSS variables defined in
// globals.css (which differ per theme), so a tone always stays legible and
// correctly hued whether the app is in Midnight (dark) or Azure (light) —
// no per-component dark-mode variant classes needed.

export const TONES = ['slate', 'blue', 'green', 'amber', 'red', 'violet'] as const;
export type Tone = (typeof TONES)[number];

/** Badge pill background/text/ring (with the glow utility from globals.css). */
export const TONE_BADGE: Record<Tone, string> = {
  slate: 'bg-[color-mix(in_srgb,var(--tone-slate)_14%,var(--color-card))] text-[var(--tone-slate)] ring-[color-mix(in_srgb,var(--tone-slate)_30%,transparent)] badge-glow-slate',
  blue: 'bg-[color-mix(in_srgb,var(--tone-blue)_14%,var(--color-card))] text-[var(--tone-blue)] ring-[color-mix(in_srgb,var(--tone-blue)_30%,transparent)] badge-glow-blue',
  green: 'bg-[color-mix(in_srgb,var(--tone-green)_14%,var(--color-card))] text-[var(--tone-green)] ring-[color-mix(in_srgb,var(--tone-green)_30%,transparent)] badge-glow-green',
  amber: 'bg-[color-mix(in_srgb,var(--tone-amber)_14%,var(--color-card))] text-[var(--tone-amber)] ring-[color-mix(in_srgb,var(--tone-amber)_30%,transparent)] badge-glow-amber',
  red: 'bg-[color-mix(in_srgb,var(--tone-red)_14%,var(--color-card))] text-[var(--tone-red)] ring-[color-mix(in_srgb,var(--tone-red)_30%,transparent)] badge-glow-red',
  violet: 'bg-[color-mix(in_srgb,var(--tone-violet)_14%,var(--color-card))] text-[var(--tone-violet)] ring-[color-mix(in_srgb,var(--tone-violet)_30%,transparent)] badge-glow-violet',
};

/** Square/rounded icon-chip background + text (StatCard, Settings role tiles, etc). */
export const TONE_CHIP: Record<Tone, string> = {
  slate: 'bg-[color-mix(in_srgb,var(--tone-slate)_12%,var(--color-card))] text-[var(--tone-slate)]',
  blue: 'bg-[color-mix(in_srgb,var(--tone-blue)_12%,var(--color-card))] text-[var(--tone-blue)]',
  green: 'bg-[color-mix(in_srgb,var(--tone-green)_12%,var(--color-card))] text-[var(--tone-green)]',
  amber: 'bg-[color-mix(in_srgb,var(--tone-amber)_12%,var(--color-card))] text-[var(--tone-amber)]',
  red: 'bg-[color-mix(in_srgb,var(--tone-red)_12%,var(--color-card))] text-[var(--tone-red)]',
  violet: 'bg-[color-mix(in_srgb,var(--tone-violet)_12%,var(--color-card))] text-[var(--tone-violet)]',
};

/** Solid dot/legend-swatch color, default weight. */
export const TONE_DOT: Record<Tone, string> = {
  slate: 'bg-[var(--tone-slate)]',
  blue: 'bg-[var(--tone-blue)]',
  green: 'bg-[var(--tone-green)]',
  amber: 'bg-[var(--tone-amber)]',
  red: 'bg-[var(--tone-red)]',
  violet: 'bg-[var(--tone-violet)]',
};

/** Solid dot, one shade stronger — used where a component needs to visually
 * distinguish two entries of the same tone (e.g. AuditTimeline's
 * compliance-level vs manager-level approve/reject). */
export const TONE_DOT_STRONG: Record<Tone, string> = {
  slate: 'bg-[color-mix(in_srgb,var(--tone-slate)_82%,var(--color-ink))]',
  blue: 'bg-[color-mix(in_srgb,var(--tone-blue)_82%,var(--color-ink))]',
  green: 'bg-[color-mix(in_srgb,var(--tone-green)_82%,var(--color-ink))]',
  amber: 'bg-[color-mix(in_srgb,var(--tone-amber)_82%,var(--color-ink))]',
  red: 'bg-[color-mix(in_srgb,var(--tone-red)_82%,var(--color-ink))]',
  violet: 'bg-[color-mix(in_srgb,var(--tone-violet)_82%,var(--color-ink))]',
};

/** Top/start accent-border color (CRA band cards, threshold rows, etc). */
export const TONE_BORDER_T: Record<Tone, string> = {
  slate: 'border-t-[var(--tone-slate)]',
  blue: 'border-t-[var(--tone-blue)]',
  green: 'border-t-[var(--tone-green)]',
  amber: 'border-t-[var(--tone-amber)]',
  red: 'border-t-[var(--tone-red)]',
  violet: 'border-t-[var(--tone-violet)]',
};
