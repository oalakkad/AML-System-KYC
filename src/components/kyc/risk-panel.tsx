'use client';

// Live risk summary shown in the wizard sidebar. Reflects the same engine the
// server uses (via buildRiskInput/assessRisk) so the maker sees the score update
// as they fill the form.

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { RiskBadge } from '@/components/status-badge';
import { RISK_THRESHOLDS, type RiskResult } from '@/lib/risk/engine';

const BAND_COLOR = { LOW: '#0f9d6d', MEDIUM: '#c77d0a', HIGH: '#dc3545' };

export function RiskPanel({ result }: { result: RiskResult }) {
  const { dict } = useI18n();
  const pct = Math.min(100, Math.round((result.score / RISK_THRESHOLDS.HIGH) * 100));
  const color = BAND_COLOR[result.rating];

  return (
    <div className="rounded-2xl border border-hairline bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          {result.rating === 'HIGH' ? (
            <AlertTriangle className="size-4 text-red-500" aria-hidden />
          ) : (
            <ShieldCheck className="size-4 text-emerald-500" aria-hidden />
          )}
          {dict.risk.systemRating}
        </h3>
        <RiskBadge rating={result.rating} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tnum text-ink">{result.score}</span>
        <span className="text-xs font-semibold text-muted">{dict.risk.score}</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      {result.factors.length === 0 ? (
        <p className="mt-4 text-xs font-medium text-muted">{dict.risk.noFactors}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {result.factors.map((f, i) => (
            <li key={`${f.key}-${i}`} className="flex items-start justify-between gap-2 text-xs">
              <span className="font-medium text-muted">
                {(dict.risk.factors as Record<string, string>)[f.key] ?? f.key}
                {f.detail && <span className="text-faint"> ({f.detail})</span>}
              </span>
              <span className="shrink-0 font-bold tnum text-primary">+{f.points}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Re-exported for existing importers (e.g. case-summary.tsx) — the actual
// implementation lives in lib/risk/labels.ts (a plain, non-client module) so
// server components like kyc-print-form.tsx can call it directly instead of
// pulling a function out of this 'use client' file at runtime.
export { riskFactorLabel } from '@/lib/risk/labels';
