import { notFound, redirect } from 'next/navigation';
import { requireClientSession } from '@/lib/auth/client-session';
import { getDict } from '@/lib/i18n';
import { prisma } from '@/lib/db';
import { profileToForm } from '@/lib/cases/mappers';
import { getCountryOptions, getFatfSettings } from '@/lib/cases/queries';
import { PortalKycWizard } from '@/components/portal/portal-kyc-wizard';
import type { DocType } from '@/lib/constants';

export default async function PortalEditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClientSession();
  const { id } = await params;
  const { dict } = await getDict();

  const kase = await prisma.kycCase.findUnique({
    where: { id },
    include: { profile: true, documents: true },
  });
  if (!kase || kase.clientType !== 'INDIVIDUAL' || !kase.profile) notFound();
  if (kase.clientMakerId !== session.clientUserId) notFound();
  if (kase.status !== 'DRAFT' && kase.status !== 'RETURNED') redirect(`/portal/cases/${id}`);

  const [countries, fatfSettings] = await Promise.all([getCountryOptions(), getFatfSettings()]);
  const initialDocs = kase.documents.map((d) => ({
    id: d.id,
    docType: d.docType as DocType,
    fileName: d.fileName,
    sizeBytes: d.sizeBytes,
  }));
  const returnedNotes = kase.status === 'RETURNED' ? kase.complianceNotes : null;

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-muted">{dict.caseView.caseNumber}</p>
        <h1 className="text-2xl font-bold text-ink">{kase.caseNumber}</h1>
      </div>
      <PortalKycWizard
        caseId={kase.id}
        initialValues={profileToForm(kase.profile, { formType: kase.formType, clientNo: kase.clientNo })}
        countries={countries}
        initialDocs={initialDocs}
        fatfSettings={fatfSettings}
        returnedNotes={returnedNotes}
      />
    </div>
  );
}
