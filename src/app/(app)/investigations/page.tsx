import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getInvestigationsByStatus, getEscalatableAlerts } from '@/lib/investigations/queries';
import { EscalateAlertsPanel } from './escalate-alerts-panel';
import { InvestigationCard } from './investigation-card';
import { INVESTIGATION_STATUSES, type InvestigationStatus } from '@/lib/constants';

export default async function InvestigationsPage() {
  await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict, locale } = await getDict();

  const [byStatus, escalatable] = await Promise.all([getInvestigationsByStatus(), getEscalatableAlerts()]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{dict.investigations.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.investigations.subtitle}</p>
      </div>

      <EscalateAlertsPanel
        alerts={escalatable.map((a) => ({
          id: a.id,
          severity: a.severity,
          alertType: a.alertType,
          clientName: a.transaction.case.profile?.fullName ?? a.transaction.case.corporateProfile?.legalName ?? a.transaction.case.caseNumber,
          ruleName: a.rule.name,
        }))}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {INVESTIGATION_STATUSES.map((status) => {
          const cards = byStatus[status as InvestigationStatus];
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">{dict.investigationStatuses[status]}</h2>
                <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-semibold text-muted">{cards.length}</span>
              </div>
              <div className="space-y-3">
                {cards.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-hairline p-4 text-center text-xs text-faint">
                    {dict.investigations.noCases}
                  </p>
                ) : (
                  cards.map((c) => (
                    <InvestigationCard
                      key={c.id}
                      card={{
                        id: c.id,
                        caseRef: c.caseRef,
                        status: c.status,
                        findings: c.findings,
                        clientName: c.kycCase.profile?.fullName ?? c.kycCase.corporateProfile?.legalName ?? c.kycCase.caseNumber,
                        alertType: c.alert.alertType,
                        alertSeverity: c.alert.severity,
                        openedByName: c.openedBy ? (locale === 'ar' ? c.openedBy.nameAr : c.openedBy.nameEn) : null,
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
