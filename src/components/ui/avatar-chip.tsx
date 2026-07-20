// Deterministic client-identity avatar — colored initials chip. Used anywhere
// a client name is listed in a table row (cases list, dashboard recent cases).
// Palette is deliberately distinct from the semantic risk/status hues
// (green/amber/red/violet/blue) so an avatar is never mistaken for a status
// signal — it identifies who, not what state they're in.

const AVATAR_PALETTE = [
  { bg: '#e0f5f3', text: '#0d9488' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#f5ede4', text: '#92603a' },
  { bg: '#e5f3f5', text: '#0e7490' },
  { bg: '#f3e8f5', text: '#86198f' },
  { bg: '#eef2ff', text: '#4338ca' },
];

function avatarStyle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? ''));
}

export function AvatarChip({ name, className }: { name: string; className?: string }) {
  const style = avatarStyle(name);
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${className ?? ''}`}
      style={{ background: style.bg, color: style.text }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
