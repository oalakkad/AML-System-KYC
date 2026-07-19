'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { escalateAlertToCase } from '@/lib/investigations/actions';
import type { AlertSeverity } from '@/lib/constants';

export interface EscalatableAlert {
  id: string;
  severity: string;
  alertType: string;
  clientName: string;
  ruleName: string;
}

const SEVERITY_TONE: Record<AlertSeverity, 'slate' | 'amber' | 'red' | 'violet'> = {
  LOW: 'slate',
  MEDIUM: 'amber',
  HIGH: 'red',
  CRITICAL: 'violet',
};

export function EscalateAlertsPanel({ alerts }: { alerts: EscalatableAlert[] }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const escalate = (alertId: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('alertId', alertId);
      await escalateAlertToCase(fd);
      router.refresh();
    });
  };

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader title={dict.investigations.escalatableTitle} />
      <CardBody className="space-y-2">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-hairline p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{a.clientName}</span>
                <Badge tone={SEVERITY_TONE[a.severity as AlertSeverity] ?? 'slate'}>
                  {dict.riskAssessment.bands[a.severity as AlertSeverity] ?? a.severity}
                </Badge>
              </div>
              <p className="text-xs text-faint">
                {dict.alertTypes[a.alertType as keyof typeof dict.alertTypes] ?? a.alertType} · {a.ruleName}
              </p>
            </div>
            <Button size="sm" disabled={pending} onClick={() => escalate(a.id)}>
              {dict.investigations.escalate}
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
