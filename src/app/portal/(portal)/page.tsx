import Link from 'next/link';
import { FileQuestion, ChevronRight, Plus } from 'lucide-react';
import { requireClientSession } from '@/lib/auth/client-session';
import { getDict } from '@/lib/i18n';
import { getClientCases } from '@/lib/portal/queries';
import { createClientCase } from '@/lib/portal/actions';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { CaseStatus, ClientType } from '@/lib/constants';

export default async function PortalDashboardPage() {
  const session = await requireClientSession();
  const { dict, locale } = await getDict();
  const cases = await getClientCases(session.clientUserId, session.email);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{dict.portal.dashboardTitle}</h1>
          <p className="mt-1 text-sm text-muted">{dict.portal.dashboardSubtitle}</p>
        </div>
        <form action={createClientCase}>
          <Button type="submit" size="sm">
            <Plus className="size-4" aria-hidden />
            {dict.portal.newKyc}
          </Button>
        </form>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <FileQuestion className="size-10 text-faint" aria-hidden />
            <p className="text-sm font-medium text-ink">{dict.portal.noCases}</p>
            <p className="max-w-sm text-sm text-muted">{dict.portal.noCasesHint}</p>
          </CardBody>
        </Card>
      ) : (
        <ul className="space-y-3">
          {cases.map((c) => {
            const displayName =
              c.clientType === 'CORPORATE' ? c.corporateProfile?.legalName : c.profile?.fullName;
            const isOwnDraft = c.status === 'DRAFT' && c.clientMakerId === session.clientUserId;
            const href = isOwnDraft ? `/portal/cases/${c.id}/edit` : `/portal/cases/${c.id}`;
            return (
              <li key={c.id}>
                <Link href={href}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardBody className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{c.caseNumber}</p>
                          <StatusBadge status={c.status as CaseStatus} />
                          {!isOwnDraft && (
                            <Badge tone={c.clientSignedAt ? 'green' : 'amber'}>
                              {c.clientSignedAt ? dict.portal.signed : dict.portal.notSigned}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-muted">
                          {displayName || dict.common.notProvided} ·{' '}
                          {dict.clientType[c.clientType as ClientType]} ·{' '}
                          {c.submittedAt
                            ? `${dict.caseView.submittedAt}: ${formatDate(c.submittedAt, locale)}`
                            : `${dict.caseView.createdAt}: ${formatDate(c.createdAt, locale)}`}
                        </p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-faint rtl:rotate-180" aria-hidden />
                    </CardBody>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
