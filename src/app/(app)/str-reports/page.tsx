import { FileText, Clock, Eye, CheckCircle2 } from 'lucide-react';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getStrStats, getRecentStrReports, getInvestigationsForStrLink } from '@/lib/str/queries';
import { getApprovedCasesForTxnEntry } from '@/lib/transactions/queries';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/stat-card';
import { formatDate } from '@/lib/utils';
import { interpolate } from '@/lib/i18n/interpolate';
import { NewStrDialog } from './new-str-dialog';
import { StrRowActions } from './str-row-actions';
import type { StrStatus } from '@/lib/constants';

const STATUS_TONE: Record<StrStatus, 'slate' | 'amber' | 'green'> = {
  IN_PREPARATION: 'slate',
  UNDER_REVIEW: 'amber',
  SUBMITTED: 'green',
};

export default async function StrReportsPage() {
  await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict, locale } = await getDict();

  const [stats, reports, cases, investigations] = await Promise.all([
    getStrStats(),
    getRecentStrReports(),
    getApprovedCasesForTxnEntry(),
    getInvestigationsForStrLink(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{dict.strReports.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.strReports.subtitle}</p>
        </div>
        <NewStrDialog cases={cases} investigations={investigations} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={interpolate(dict.strReports.totalThisYear, { year: new Date().getFullYear() })}
          value={stats.totalThisYear}
          icon={FileText}
          tone="slate"
        />
        <StatCard label={dict.strReports.inPreparation} value={stats.inPreparation} icon={Clock} tone="slate" />
        <StatCard label={dict.strReports.underReview} value={stats.underReview} icon={Eye} tone="amber" />
        <StatCard label={dict.strReports.submitted} value={stats.submitted} icon={CheckCircle2} tone="green" />
      </div>

      <Card>
        <CardHeader title={dict.strReports.recentTitle} />
        <CardBody className="p-0">
          {reports.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{dict.strReports.noReports}</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th className="text-start">{dict.strReports.reportRef}</Th>
                  <Th className="text-start">{dict.strReports.client}</Th>
                  <Th>{dict.strReports.status}</Th>
                  <Th className="text-start">{dict.strReports.preparedBy}</Th>
                  <Th>{dict.strReports.date}</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {reports.map((r) => {
                  const clientName = r.kycCase.profile?.fullName ?? r.kycCase.corporateProfile?.legalName ?? r.kycCase.caseNumber;
                  return (
                    <Tr key={r.id}>
                      <Td dir="ltr" className="text-start text-xs">
                        {r.reportRef}
                      </Td>
                      <Td className="text-start">{clientName}</Td>
                      <Td>
                        <Badge tone={STATUS_TONE[r.status as StrStatus]}>{dict.strStatuses[r.status as StrStatus]}</Badge>
                      </Td>
                      <Td className="text-start text-xs text-faint">
                        {r.preparedBy ? (locale === 'ar' ? r.preparedBy.nameAr : r.preparedBy.nameEn) : '—'}
                      </Td>
                      <Td className="whitespace-nowrap text-xs">{formatDate(r.createdAt, locale)}</Td>
                      <Td>
                        <StrRowActions strId={r.id} status={r.status as StrStatus} />
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
