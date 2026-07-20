'use client';

// Read-only presentation of a decrypted KYC profile. The server decrypts and
// passes plain display strings — this component only renders/labels them.

import { useI18n } from '@/lib/i18n/client';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/status-badge';
import { riskFactorLabel } from './risk-panel';
import type { RiskFactor } from '@/lib/risk/engine';
import type { RiskRating } from '@/lib/constants';

export interface DisplayField {
  label: string;
  value: string | null;
}

export interface DisplaySection {
  title: string;
  fields: DisplayField[];
}

function Row({ label, value }: DisplayField) {
  const { dict } = useI18n();
  return (
    <div className="flex flex-col gap-0.5 border-b border-hairline py-2.5 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink sm:text-end">
        {value || <span className="font-normal text-faint">{dict.common.notProvided}</span>}
      </dd>
    </div>
  );
}

export function CaseSummary({
  sections,
  risk,
}: {
  sections: DisplaySection[];
  risk: {
    systemRating: RiskRating | null;
    finalRating: RiskRating | null;
    score: number | null;
    factors: RiskFactor[];
    overrideJustification: string | null;
  };
}) {
  const { dict } = useI18n();
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title={dict.caseView.riskAssessment} />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">{dict.risk.score}</p>
              <p className="mt-0.5 text-3xl font-bold tnum text-ink">{risk.score ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{dict.risk.systemRating}</p>
              <div className="mt-1">
                <RiskBadge rating={risk.systemRating} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">{dict.risk.finalRating}</p>
              <div className="mt-1">
                <RiskBadge rating={risk.finalRating} />
              </div>
            </div>
          </div>
          {risk.overrideJustification && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">{dict.risk.justification}</p>
              <p className="mt-0.5 text-sm text-amber-900">{risk.overrideJustification}</p>
            </div>
          )}
          {risk.factors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">
                {dict.risk.breakdown}
              </p>
              <div className="flex flex-wrap gap-2">
                {risk.factors.map((f, i) => (
                  <Badge key={`${f.key}-${i}`} tone="slate">
                    {riskFactorLabel(f.key, dict)} +{f.points}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {sections.map((s) => (
        <Card key={s.title}>
          <CardHeader title={s.title} />
          <CardBody>
            <dl>
              {s.fields.map((f, i) => (
                <Row key={i} {...f} />
              ))}
            </dl>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
