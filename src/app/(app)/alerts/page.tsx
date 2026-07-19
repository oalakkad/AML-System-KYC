import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getAlerts, getAlertCounts } from '@/lib/transactions/queries';
import { Card, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { AlertRowActions } from './alert-row-actions';
import { cn } from '@/lib/utils';
import { ALERT_SEVERITIES, type AlertSeverity, type AlertStatus } from '@/lib/constants';

const SEVERITY_TONE: Record<AlertSeverity, 'slate' | 'amber' | 'red' | 'violet'> = {
  LOW: 'slate',
  MEDIUM: 'amber',
  HIGH: 'red',
  CRITICAL: 'violet',
};

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>;
}) {
  await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict, locale } = await getDict();
  const { severity: severityParam } = await searchParams;
  const severity = (ALERT_SEVERITIES as readonly string[]).includes(severityParam ?? '')
    ? (severityParam as AlertSeverity)
    : undefined;

  const [alerts, alertCounts] = await Promise.all([getAlerts({ severity }), getAlertCounts()]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{dict.alerts.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.alerts.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/alerts"
          className={cn(
            'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            !severity ? 'border-primary/40 bg-primary-soft text-primary' : 'border-hairline bg-white text-muted hover:bg-subtle',
          )}
        >
          {dict.alerts.all} ({alertCounts.total})
        </Link>
        {ALERT_SEVERITIES.map((s) => (
          <Link
            key={s}
            href={`/alerts?severity=${s}`}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              severity === s ? 'border-primary/40 bg-primary-soft text-primary' : 'border-hairline bg-white text-muted hover:bg-subtle',
            )}
          >
            {dict.riskAssessment.bands[s]} ({alertCounts.counts[s]})
          </Link>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {alerts.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted">🎉 {dict.alerts.noAlerts}</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>{dict.alerts.created}</Th>
                  <Th className="text-start">{dict.transactions.client}</Th>
                  <Th className="text-start">{dict.transactions.reference}</Th>
                  <Th>{dict.alerts.type}</Th>
                  <Th>{dict.alerts.rule}</Th>
                  <Th>{dict.alerts.severity}</Th>
                  <Th>{dict.alerts.status}</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {alerts.map((a) => {
                  const clientName =
                    a.transaction.case.profile?.fullName ??
                    a.transaction.case.corporateProfile?.legalName ??
                    a.transaction.case.caseNumber;
                  return (
                    <Tr key={a.id}>
                      <Td className="whitespace-nowrap text-xs">{formatDateTime(a.createdAt, locale)}</Td>
                      <Td className="text-start">{clientName}</Td>
                      <Td dir="ltr" className="text-start text-xs">
                        {a.transaction.txnRef}
                      </Td>
                      <Td className="text-xs">{dict.alertTypes[a.alertType as keyof typeof dict.alertTypes]}</Td>
                      <Td className="text-xs text-faint">{a.rule.name}</Td>
                      <Td>
                        <Badge tone={SEVERITY_TONE[a.severity as AlertSeverity]}>
                          {dict.riskAssessment.bands[a.severity as AlertSeverity]}
                        </Badge>
                      </Td>
                      <Td className="text-xs">{dict.alertStatuses[a.status as keyof typeof dict.alertStatuses]}</Td>
                      <Td>
                        <AlertRowActions alertId={a.id} status={a.status as AlertStatus} />
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
