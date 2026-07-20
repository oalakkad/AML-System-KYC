import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getCraStats } from '@/lib/risk/cra-queries';
import { CRA_BANDS, CRA_THRESHOLDS, CRA_REVIEW_MONTHS, type CraBand } from '@/lib/risk/cra';
import { RISK_POINTS } from '@/lib/risk/engine';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { TONE_BORDER_T, type Tone } from '@/lib/theme/tones';
import { interpolate } from '@/lib/i18n/interpolate';
import { RecalculateButton } from './recalculate-button';
import type { Dict } from '@/lib/i18n/en';

// Same severity scale as AlertSeverity elsewhere (LOW/slate-adjacent through
// CRITICAL/violet) — CRA has no "very low" tier, so LOW starts at green.
const BAND_TONE: Record<CraBand, Tone> = {
  LOW: 'green',
  MEDIUM: 'amber',
  HIGH: 'red',
  CRITICAL: 'violet',
};

const FACTOR_DISPLAY: { labelKey: keyof Dict['risk']['factors']; points: number }[] = [
  { labelKey: 'pepSelf', points: RISK_POINTS.PEP_SELF },
  { labelKey: 'countryBlacklist', points: RISK_POINTS.COUNTRY_BLACKLIST },
  { labelKey: 'pepRelative', points: RISK_POINTS.PEP_RELATIVE },
  { labelKey: 'countryGreylist', points: RISK_POINTS.COUNTRY_GREYLIST },
  { labelKey: 'relatedParty', points: RISK_POINTS.RELATED_PARTY },
  { labelKey: 'managedByOther', points: RISK_POINTS.MANAGED_BY_OTHER },
  { labelKey: 'unemployed', points: RISK_POINTS.UNEMPLOYED },
  { labelKey: 'highWealth', points: RISK_POINTS.HIGH_WEALTH },
  { labelKey: 'selfEmployed', points: RISK_POINTS.SELF_EMPLOYED },
  { labelKey: 'incomeTradeOrOther', points: RISK_POINTS.INCOME_TRADE_OR_OTHER },
  { labelKey: 'incomeInheritance', points: RISK_POINTS.INCOME_INHERITANCE },
];
FACTOR_DISPLAY.sort((a, b) => b.points - a.points);

const THRESHOLD_RANGES: Record<CraBand, string> = {
  LOW: `0–${CRA_THRESHOLDS.MEDIUM - 1}`,
  MEDIUM: `${CRA_THRESHOLDS.MEDIUM}–${CRA_THRESHOLDS.HIGH - 1}`,
  HIGH: `${CRA_THRESHOLDS.HIGH}–${CRA_THRESHOLDS.CRITICAL - 1}`,
  CRITICAL: `${CRA_THRESHOLDS.CRITICAL}+`,
};

export default async function RiskAssessmentPage() {
  await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict, locale } = await getDict();
  const stats = await getCraStats();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{dict.riskAssessment.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.riskAssessment.subtitle}</p>
        </div>
        <RecalculateButton />
      </div>

      {stats.totalApprovedClients === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted">{dict.riskAssessment.noApprovedClients}</CardBody>
        </Card>
      ) : (
        <>
          {stats.notYetAssessed > 0 && (
            <Alert tone="warning">
              {interpolate(dict.riskAssessment.notYetAssessed, { count: stats.notYetAssessed })}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CRA_BANDS.map((band) => (
              <Card key={band} className={`border-t-4 ${TONE_BORDER_T[BAND_TONE[band]]}`}>
                <CardBody>
                  <p className="text-2xl font-bold tnum text-ink">{stats.counts[band]}</p>
                  <p className="text-xs font-medium text-muted">{dict.riskAssessment.bands[band]}</p>
                  <p className="mt-1 text-xs text-faint">
                    {stats.totalAssessed > 0 ? `${stats.percentages[band]}%` : '—'} · {dict.riskAssessment.cadence[band]}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={dict.riskAssessment.factorsTitle} description={dict.riskAssessment.factorsHint} />
          <CardBody className="space-y-2">
            {FACTOR_DISPLAY.map((f) => (
              <div key={f.labelKey} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{dict.risk.factors[f.labelKey]}</span>
                <span className="shrink-0 font-semibold tnum text-ink">
                  +{f.points} {dict.riskAssessment.points}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={dict.riskAssessment.thresholdsTitle} />
          <CardBody className="space-y-3">
            {CRA_BANDS.map((band) => (
              <div key={band} className={`rounded-lg border-s-4 ${TONE_BORDER_T[BAND_TONE[band]].replace('border-t-', 'border-s-')} bg-subtle p-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{dict.riskAssessment.bands[band]}</span>
                  <span className="text-xs font-medium tnum text-muted">{THRESHOLD_RANGES[band]}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {dict.riskAssessment.cadence[band]} ({CRA_REVIEW_MONTHS[band]} {locale === 'ar' ? 'شهر' : 'mo'})
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
