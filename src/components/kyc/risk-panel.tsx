'use client';

// Live risk summary shown in the wizard sidebar. Reflects the same engine the
// server uses (via buildRiskInput/assessRisk) so the maker sees the score update
// as they fill the form.

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { RiskBadge } from '@/components/status-badge';
import type { RiskResult } from '@/lib/risk/engine';
import type { Dict } from '@/lib/i18n/en';

export function RiskPanel({ result }: { result: RiskResult }) {
  const { dict } = useI18n();
  return (
    <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {result.rating === 'HIGH' ? (
            <AlertTriangle className="size-4 text-red-500" aria-hidden />
          ) : (
            <ShieldCheck className="size-4 text-emerald-500" aria-hidden />
          )}
          {dict.risk.systemRating}
        </h3>
        <RiskBadge rating={result.rating} />
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tnum text-ink">{result.score}</span>
        <span className="text-xs text-muted">{dict.risk.score}</span>
      </div>
      {result.factors.length === 0 ? (
        <p className="text-xs text-muted">{dict.risk.noFactors}</p>
      ) : (
        <ul className="space-y-1.5">
          {result.factors.map((f, i) => (
            <li key={`${f.key}-${i}`} className="flex items-start justify-between gap-2 text-xs">
              <span className="text-slate-600">
                {(dict.risk.factors as Record<string, string>)[f.key] ?? f.key}
                {f.detail && <span className="text-faint"> ({f.detail})</span>}
              </span>
              <span className="shrink-0 font-medium tnum text-primary">
                +{f.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function riskFactorLabel(key: string, dict: Dict): string {
  return (dict.risk.factors as Record<string, string>)[key] ?? key;
}
