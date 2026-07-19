'use client';

// Read-only KYC display for the client portal. Deliberately reuses the same
// DisplaySection shape as the staff CaseSummary but omits the risk panel —
// AML risk score/rating/factors are compliance-internal and must never be
// disclosed to the client being assessed.

import { useI18n } from '@/lib/i18n/client';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { DisplaySection } from '@/components/kyc/case-summary';

function Row({ label, value }: { label: string; value: string | null }) {
  const { dict } = useI18n();
  return (
    <div className="flex flex-col gap-0.5 border-b border-hairline py-2.5 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 sm:text-end">
        {value || <span className="font-normal text-faint">{dict.common.notProvided}</span>}
      </dd>
    </div>
  );
}

export function PortalCaseSummary({ sections }: { sections: DisplaySection[] }) {
  return (
    <div className="space-y-5">
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
