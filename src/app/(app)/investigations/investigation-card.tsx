'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Select, Textarea } from '@/components/ui/input';
import { updateInvestigationStatus } from '@/lib/investigations/actions';
import { INVESTIGATION_STATUSES, type InvestigationStatus, type AlertSeverity } from '@/lib/constants';

const SEVERITY_TONE: Record<AlertSeverity, 'slate' | 'amber' | 'red' | 'violet'> = {
  LOW: 'slate',
  MEDIUM: 'amber',
  HIGH: 'red',
  CRITICAL: 'violet',
};

export interface InvestigationCardData {
  id: string;
  caseRef: string;
  status: string;
  findings: string | null;
  clientName: string;
  alertType: string;
  alertSeverity: string;
  openedByName: string | null;
}

export function InvestigationCard({ card }: { card: InvestigationCardData }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [findings, setFindings] = useState(card.findings ?? '');
  const [status, setStatus] = useState(card.status as InvestigationStatus);

  const save = (nextStatus: InvestigationStatus) => {
    setStatus(nextStatus);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('investigationId', card.id);
      fd.set('status', nextStatus);
      fd.set('findings', findings);
      await updateInvestigationStatus(fd);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardBody className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span dir="ltr" className="text-xs font-semibold text-ink">
            {card.caseRef}
          </span>
          <Badge tone={SEVERITY_TONE[card.alertSeverity as AlertSeverity] ?? 'slate'}>
            {dict.riskAssessment.bands[card.alertSeverity as AlertSeverity] ?? card.alertSeverity}
          </Badge>
        </div>
        <p className="text-sm font-medium text-ink">{card.clientName}</p>
        <p className="text-xs text-faint">{dict.alertTypes[card.alertType as keyof typeof dict.alertTypes] ?? card.alertType}</p>
        {card.openedByName && (
          <p className="text-xs text-faint">
            {dict.investigations.openedBy}: {card.openedByName}
          </p>
        )}
        <Textarea
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          placeholder={dict.investigations.findingsPlaceholder}
          rows={2}
          className="text-xs"
        />
        <div className="flex items-center gap-2">
          <Select
            value={status}
            disabled={pending}
            onChange={(e) => save(e.target.value as InvestigationStatus)}
            className="h-8 flex-1 text-xs"
          >
            {INVESTIGATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {dict.investigationStatuses[s]}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => save(status)}>
            {dict.investigations.save}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
