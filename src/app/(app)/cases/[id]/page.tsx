import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { prisma } from '@/lib/db';
import { canEditCase } from '@/lib/workflow';
import { getCountryOptions } from '@/lib/cases/queries';
import { buildDisplaySections } from '@/lib/cases/display';
import { buildCorporateDisplaySections } from '@/lib/cases/corporate-display';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { CaseSummary } from '@/components/kyc/case-summary';
import { DecisionPanel } from '@/components/kyc/decision-panel';
import { AuditTimeline, type TimelineEntry } from '@/components/kyc/audit-timeline';
import { DocumentsPanel } from '@/components/kyc/documents-panel';
import { formatDate } from '@/lib/utils';
import type { CaseStatus, DocType, RiskRating, AuditAction } from '@/lib/constants';
import type { RiskFactor } from '@/lib/risk/engine';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const { dict, locale } = await getDict();

  const kase = await prisma.kycCase.findUnique({
    where: { id },
    include: {
      profile: true,
      corporateProfile: true,
      documents: { orderBy: { createdAt: 'asc' } },
      maker: { select: { nameEn: true, nameAr: true } },
      clientMaker: { select: { nameEn: true, nameAr: true } },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { nameEn: true, nameAr: true } },
          clientActor: { select: { nameEn: true, nameAr: true } },
        },
      },
    },
  });
  const isCorporate = kase?.clientType === 'CORPORATE';
  if (!kase || (isCorporate ? !kase.corporateProfile : !kase.profile)) notFound();

  // Front office may only see their own cases, plus any client self-submitted
  // case (no staff maker) — mirrors frontOfficeScopedWhere in the list view.
  const isMaker = kase.makerId === session.userId;
  if (session.role === 'FRONT_OFFICE' && !isMaker && !kase.clientMakerId) notFound();

  const status = kase.status as CaseStatus;
  const editable = canEditCase(status, session.role, isMaker);
  const countries = await getCountryOptions();
  const sections = isCorporate
    ? buildCorporateDisplaySections(kase, kase.corporateProfile!, countries, locale)
    : buildDisplaySections(kase, kase.profile!, countries, locale);
  const displayName = isCorporate ? kase.corporateProfile!.legalName : kase.profile!.fullName;

  const canReview = session.role === 'COMPLIANCE_OFFICER' && status === 'PENDING_COMPLIANCE';
  const canApprove = session.role === 'SENIOR_MANAGER' && status === 'PENDING_MANAGER';

  const timeline: TimelineEntry[] = kase.auditLogs
    .filter((l) =>
      [
        'CASE_CREATED',
        'CASE_SUBMITTED',
        'RISK_OVERRIDDEN',
        'COMPLIANCE_APPROVED',
        'COMPLIANCE_REJECTED',
        'COMPLIANCE_RETURNED',
        'COMPLIANCE_ESCALATED',
        'MANAGER_APPROVED',
        'MANAGER_REJECTED',
      ].includes(l.action),
    )
    .map((l) => {
      let notes: string | null = null;
      try {
        notes = l.detailsJson ? (JSON.parse(l.detailsJson).notes ?? null) : null;
      } catch {
        notes = null;
      }
      const actorName = l.actor
        ? (locale === 'ar' ? l.actor.nameAr : l.actor.nameEn)
        : l.clientActor
          ? (locale === 'ar' ? l.clientActor.nameAr : l.clientActor.nameEn)
          : null;
      return {
        id: l.id,
        action: l.action as AuditAction,
        actorName,
        notes,
        createdAt: l.createdAt.toISOString(),
      };
    });

  const risk = {
    systemRating: kase.systemRiskRating as RiskRating | null,
    finalRating: kase.finalRiskRating as RiskRating | null,
    score: kase.systemRiskScore,
    factors: (kase.riskFactorsJson ? JSON.parse(kase.riskFactorsJson) : []) as RiskFactor[],
    overrideJustification: kase.overrideJustification,
  };
  const makerName = kase.maker
    ? (locale === 'ar' ? kase.maker.nameAr : kase.maker.nameEn)
    : kase.clientMaker
      ? `${locale === 'ar' ? kase.clientMaker.nameAr : kase.clientMaker.nameEn} ${dict.caseView.selfServiceSuffix}`
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{kase.caseNumber}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {displayName || dict.common.notProvided} · {dict.caseView.maker}: {makerName} ·{' '}
            {dict.caseView.submittedAt}: {formatDate(kase.submittedAt, locale)}
          </p>
        </div>
        {editable && (
          <Link href={`/cases/${kase.id}/edit`}>
            <Button>
              <Pencil className="size-4" aria-hidden />
              {status === 'RETURNED' ? dict.caseView.continueEditing : dict.common.edit}
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <CaseSummary sections={sections} risk={risk} />
        </div>

        <aside className="space-y-6">
          {(canReview || canApprove) && (
            <Card>
              <CardHeader
                title={canReview ? dict.caseView.complianceDecision : dict.caseView.managerDecision}
              />
              <CardBody>
                <DecisionPanel
                  caseId={kase.id}
                  stage={canReview ? 'compliance' : 'manager'}
                  isHighRisk={kase.finalRiskRating === 'HIGH'}
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title={dict.caseView.documents} />
            <CardBody>
              <DocumentsPanel
                caseId={kase.id}
                readOnly
                docs={kase.documents.map((d) => ({
                  id: d.id,
                  docType: d.docType as DocType,
                  fileName: d.fileName,
                  sizeBytes: d.sizeBytes,
                }))}
              />
            </CardBody>
          </Card>

          {timeline.length > 0 && (
            <Card>
              <CardHeader title={dict.caseView.timeline} />
              <CardBody>
                <AuditTimeline entries={timeline} />
              </CardBody>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
