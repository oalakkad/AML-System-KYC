// A print-only, bank-form-style rendering of a KYC case for the physical
// record: bilingual (English + Arabic) section bars and field labels,
// Yes/No checkboxes, and a signature/initial block — mirroring a
// traditional paper KYC form rather than the on-screen card UI. Always
// bilingual regardless of the viewer's language toggle (confirmed design
// direction), so this reads dict text directly from both `en`/`ar` instead
// of useI18n(). Hidden on screen (`hidden print:block`); the interactive
// dashboard around it is marked `print:hidden` so this is the only thing
// that ends up on paper/PDF. Deliberately uses fixed black/white/gray
// colors instead of the app's theme tokens so it prints the same in
// Midnight or Azure mode.

import { en } from '@/lib/i18n/en';
import { ar } from '@/lib/i18n/ar';
import { riskFactorLabel } from './risk-panel';
import type { BilingualSection } from '@/lib/cases/print-bilingual';
import type { CaseStatus, RiskRating } from '@/lib/constants';

const STATUS_EN = en.status as Record<string, string>;
const STATUS_AR = ar.status as Record<string, string>;

function decisionLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const e = STATUS_EN[code] ?? (code === 'ESCALATED' ? 'Escalated' : code);
  const a = STATUS_AR[code] ?? (code === 'ESCALATED' ? 'تمت الإحالة' : code);
  return `${e} / ${a}`;
}

export interface KycPrintRiskFactor {
  key: string;
  points: number;
}

export interface KycPrintRisk {
  systemRating: RiskRating | null;
  finalRating: RiskRating | null;
  score: number | null;
  factors: KycPrintRiskFactor[];
  overrideJustification: string | null;
}

export interface KycPrintParty {
  labelEn: string;
  labelAr: string;
  name: string | null;
  decision?: string | null;
  notes?: string | null;
  at?: string | null;
}

export interface KycPrintFormProps {
  clientTypeEn: 'Individual' | 'Corporate';
  clientTypeAr: string;
  caseNumber: string;
  displayName: string | null;
  status: CaseStatus;
  createdAt: string;
  submittedAt: string | null;
  sections: BilingualSection[];
  risk?: KycPrintRisk | null;
  parties: KycPrintParty[];
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex size-3 shrink-0 items-center justify-center border border-black text-[9px] leading-none">
      {checked ? '✓' : ''}
    </span>
  );
}

function BilingualBar({ en: labelEn, ar: labelAr }: { en: string; ar: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-gray-800 px-2 py-1 text-white">
      <span className="text-[11px] font-bold uppercase tracking-wide">{labelEn}</span>
      <span dir="rtl" className="text-[11px] font-bold">
        {labelAr}
      </span>
    </div>
  );
}

function Row({ labelEn, labelAr, value }: { labelEn: string; labelAr: string; value: string | null }) {
  if (value === 'Yes' || value === 'No') {
    const isYes = value === 'Yes';
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 py-1.5 text-[11px] break-inside-avoid">
        <span className="font-medium">
          {labelEn} / <span dir="rtl">{labelAr}</span>
        </span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Checkbox checked={!isYes} /> No / كلا
          </span>
          <span className="flex items-center gap-1">
            <Checkbox checked={isYes} /> Yes / نعم
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-2 border-b border-gray-300 py-1.5 text-[11px] break-inside-avoid">
      <span className="w-[34%] shrink-0 font-medium text-gray-700">{labelEn}</span>
      <span className="flex-1 border-b border-dotted border-gray-400 px-1 font-semibold text-black">
        {value || ' '}
      </span>
      <span dir="rtl" className="w-[28%] shrink-0 text-end font-medium text-gray-700">
        {labelAr}
      </span>
    </div>
  );
}

export function KycPrintForm({
  clientTypeEn,
  clientTypeAr,
  caseNumber,
  displayName,
  status,
  createdAt,
  submittedAt,
  sections,
  risk,
  parties,
}: KycPrintFormProps) {
  return (
    <div className="hidden print:block print:text-black">
      <div className="mb-3 border-b-2 border-black pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-extrabold tracking-tight">
              Know Your Client Form ({clientTypeEn})
            </p>
            <p dir="rtl" className="text-sm font-bold">
              نموذج اعرف عميلك ({clientTypeAr})
            </p>
          </div>
          <div className="text-end text-[11px]">
            <p>
              Case No. / رقم الطلب: <span className="font-semibold">{caseNumber}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1 border border-gray-300 p-2 sm:grid-cols-4">
        <Row labelEn="Client" labelAr="العميل" value={displayName} />
        <Row labelEn="Status" labelAr="الحالة" value={`${STATUS_EN[status]} / ${STATUS_AR[status]}`} />
        <Row labelEn="Created" labelAr="تاريخ الإنشاء" value={createdAt} />
        <Row labelEn="Submitted" labelAr="تاريخ الإرسال" value={submittedAt} />
      </div>

      {risk && (
        <div className="mb-3 break-inside-avoid border border-gray-300">
          <BilingualBar en="Risk Assessment (Compliance Use Only)" ar="تقييم المخاطر (لاستخدام الامتثال فقط)" />
          <div className="p-2">
            <div className="grid grid-cols-3 gap-4">
              <Row labelEn="Score" labelAr="الدرجة" value={risk.score !== null ? String(risk.score) : null} />
              <Row
                labelEn="System Rating"
                labelAr="التصنيف الآلي"
                value={risk.systemRating ? `${en.risk[risk.systemRating]} / ${ar.risk[risk.systemRating]}` : null}
              />
              <Row
                labelEn="Final Rating"
                labelAr="التصنيف النهائي"
                value={risk.finalRating ? `${en.risk[risk.finalRating]} / ${ar.risk[risk.finalRating]}` : null}
              />
            </div>
            {risk.overrideJustification && (
              <div className="mt-2">
                <p className="text-[11px] font-semibold text-gray-600">Override Justification</p>
                <p className="text-[11px]">{risk.overrideJustification}</p>
              </div>
            )}
            {risk.factors.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[11px] font-semibold text-gray-600">Risk Breakdown</p>
                <p className="text-[11px]">
                  {risk.factors
                    .map((f) => `${riskFactorLabel(f.key, en)} (+${f.points})`)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {sections.map((s) => (
        <div key={s.titleEn} className="mb-3 break-inside-avoid border border-gray-300">
          <BilingualBar en={s.titleEn} ar={s.titleAr} />
          <div className="p-2">
            {s.fields.map((f, i) => (
              <Row key={i} labelEn={f.labelEn} labelAr={f.labelAr} value={f.value} />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 border-t-2 border-black pt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide">
          Undertaking — I/we confirm the information above is true and accurate. / أقر بأن المعلومات أعلاه صحيحة ودقيقة.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {parties.map((p) => (
            <div key={p.labelEn} className="break-inside-avoid">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                {p.labelEn} / <span dir="rtl">{p.labelAr}</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold">{p.name || '—'}</p>
              {p.decision && <p className="text-[11px]">{decisionLabel(p.decision)}</p>}
              {p.notes && <p className="text-[11px] text-gray-700">{p.notes}</p>}
              {p.at && <p className="text-[11px] text-gray-600">{p.at}</p>}
              <div className="mt-6 border-t border-black pt-1 text-[10px] text-gray-600">
                Signature / التوقيع &nbsp;&nbsp;&nbsp; Date / التاريخ
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
