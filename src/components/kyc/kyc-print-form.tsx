'use client';

// A print-only, physical-form-style rendering of a KYC case — filled in with
// every value captured on the case, laid out like a paper form rather than the
// on-screen card UI. Hidden on screen (`hidden print:block`); the interactive
// dashboard around it is marked `print:hidden` so this is the only thing that
// ends up on paper/PDF. Deliberately uses fixed black/white/gray colors
// instead of the app's theme tokens so it prints the same in Midnight or
// Azure mode.

import { useI18n } from '@/lib/i18n/client';
import { riskFactorLabel } from './risk-panel';
import type { DisplaySection } from './case-summary';
import type { RiskFactor } from '@/lib/risk/engine';
import type { CaseStatus, RiskRating } from '@/lib/constants';

export interface KycPrintRisk {
  systemRating: RiskRating | null;
  finalRating: RiskRating | null;
  score: number | null;
  factors: RiskFactor[];
  overrideJustification: string | null;
}

export interface KycPrintParty {
  label: string;
  name: string | null;
  decision?: string | null;
  notes?: string | null;
  at?: string | null;
}

export interface KycPrintFormProps {
  caseNumber: string;
  displayName: string | null;
  status: CaseStatus;
  createdAt: string;
  submittedAt: string | null;
  sections: DisplaySection[];
  risk?: KycPrintRisk | null;
  parties: KycPrintParty[];
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-300 py-1.5 break-inside-avoid sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-medium text-gray-600">{label}</dt>
      <dd className="text-[11px] font-semibold text-black sm:text-end">{value || '—'}</dd>
    </div>
  );
}

export function KycPrintForm({
  caseNumber,
  displayName,
  status,
  createdAt,
  submittedAt,
  sections,
  risk,
  parties,
}: KycPrintFormProps) {
  const { dict } = useI18n();

  return (
    <div className="hidden print:block print:text-black">
      <div className="mb-4 flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-lg font-extrabold tracking-tight">{dict.common.appName}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            {dict.common.kycModule}
          </p>
        </div>
        <div className="text-end">
          <p className="text-sm font-bold">{dict.caseView.printForm}</p>
          <p className="text-[11px] text-gray-600">
            {dict.caseView.caseNumber}: {caseNumber}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 border border-gray-300 p-3 sm:grid-cols-4">
        <Field label={dict.caseView.client} value={displayName} />
        <Field label={dict.caseView.status} value={dict.status[status]} />
        <Field label={dict.caseView.createdAt} value={createdAt} />
        <Field label={dict.caseView.submittedAt} value={submittedAt} />
      </div>

      {risk && (
        <div className="mb-4 break-inside-avoid border border-gray-300 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide">{dict.caseView.riskAssessment}</p>
          <div className="grid grid-cols-3 gap-4">
            <Field label={dict.risk.score} value={risk.score !== null ? String(risk.score) : null} />
            <Field label={dict.risk.systemRating} value={risk.systemRating ? dict.risk[risk.systemRating] : null} />
            <Field label={dict.risk.finalRating} value={risk.finalRating ? dict.risk[risk.finalRating] : null} />
          </div>
          {risk.overrideJustification && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-gray-600">{dict.risk.justification}</p>
              <p className="text-[11px]">{risk.overrideJustification}</p>
            </div>
          )}
          {risk.factors.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[11px] font-semibold text-gray-600">{dict.risk.breakdown}</p>
              <p className="text-[11px]">
                {risk.factors.map((f) => `${riskFactorLabel(f.key, dict)} (+${f.points})`).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {sections.map((s) => (
        <div key={s.title} className="mb-4 break-inside-avoid border border-gray-300 p-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide">{s.title}</p>
          <dl>
            {s.fields.map((f, i) => (
              <Field key={i} {...f} />
            ))}
          </dl>
        </div>
      ))}

      <div className="mt-6 grid grid-cols-1 gap-6 border-t-2 border-black pt-4 sm:grid-cols-3">
        {parties.map((p) => (
          <div key={p.label} className="break-inside-avoid">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">{p.label}</p>
            <p className="mt-1 text-[11px] font-semibold">{p.name || '—'}</p>
            {p.decision && <p className="text-[11px]">{p.decision}</p>}
            {p.notes && <p className="text-[11px] text-gray-700">{p.notes}</p>}
            {p.at && <p className="text-[11px] text-gray-600">{p.at}</p>}
            <div className="mt-6 border-t border-black pt-1 text-[10px] text-gray-600">
              {dict.caseView.signature} / {dict.caseView.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
