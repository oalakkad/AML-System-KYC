import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, Pencil } from 'lucide-react';
import { requireClientSession } from '@/lib/auth/client-session';
import { getDict } from '@/lib/i18n';
import { getClientCase } from '@/lib/portal/queries';
import { getCountryOptions } from '@/lib/cases/queries';
import { buildDisplaySections } from '@/lib/cases/display';
import { buildCorporateDisplaySections } from '@/lib/cases/corporate-display';
import { StatusBadge } from '@/components/status-badge';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PortalCaseSummary } from '@/components/portal/portal-case-summary';
import { PortalCaseDocuments } from './documents-section';
import { SignPanel } from '@/components/portal/sign-panel';
import { CASE_STATUSES_CLOSED_TO_CLIENT, type CaseStatus, type DocType } from '@/lib/constants';

export default async function PortalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClientSession();
  const { id } = await params;
  const { dict, locale } = await getDict();

  const kase = await getClientCase(id, session.clientUserId, session.email);
  const isCorporate = kase?.clientType === 'CORPORATE';
  if (!kase || (isCorporate ? !kase.corporateProfile : !kase.profile)) notFound();

  const isOwnCase = kase.clientMakerId === session.clientUserId;
  if (kase.status === 'DRAFT') {
    // A self-created draft is still being filled in — nothing to review yet.
    // A staff-created draft means front office hasn't submitted it yet.
    if (isOwnCase) redirect(`/portal/cases/${kase.id}/edit`);
    notFound();
  }

  const countries = await getCountryOptions();
  const sections = isCorporate
    ? buildCorporateDisplaySections(kase, kase.corporateProfile!, countries, locale)
    : buildDisplaySections(kase, kase.profile!, countries, locale);
  const displayName = isCorporate ? kase.corporateProfile!.legalName : kase.profile!.fullName;
  const status = kase.status as CaseStatus;
  const closed = CASE_STATUSES_CLOSED_TO_CLIENT.includes(status);

  const reviewerNotes =
    status === 'RETURNED'
      ? kase.complianceNotes
      : status === 'REJECTED'
        ? (kase.managerDecision === 'REJECTED' ? kase.managerNotes : kase.complianceNotes)
        : null;

  return (
    <div className="space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
        {dict.portal.backToCases}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{kase.caseNumber}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-muted">{displayName || dict.common.notProvided}</p>
        </div>
        {isOwnCase && status === 'RETURNED' && (
          <Link href={`/portal/cases/${kase.id}/edit`}>
            <Button size="sm">
              <Pencil className="size-4" aria-hidden />
              {dict.portal.editAndResubmit}
            </Button>
          </Link>
        )}
      </div>

      {(status === 'RETURNED' || status === 'REJECTED') && (
        <Alert tone={status === 'REJECTED' ? 'danger' : 'warning'} title={dict.portal.reviewerNotesTitle}>
          {reviewerNotes || dict.portal.noReviewerNotes}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <h2 className="mb-3 text-lg font-bold text-ink">{dict.portal.caseSummary}</h2>
          <PortalCaseSummary sections={sections} />
        </div>

        <aside className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-bold text-ink">{dict.portal.uploadSectionTitle}</h2>
            <PortalCaseDocuments
              caseId={kase.id}
              initialDocs={kase.documents.map((d) => ({
                id: d.id,
                docType: d.docType as DocType,
                fileName: d.fileName,
                sizeBytes: d.sizeBytes,
              }))}
              disabled={closed}
            />
          </div>

          <SignPanel
            caseId={kase.id}
            signedAt={kase.clientSignedAt ? kase.clientSignedAt.toISOString() : null}
            signedBy={kase.clientSignatureName}
            disabled={closed}
          />
        </aside>
      </div>
    </div>
  );
}
