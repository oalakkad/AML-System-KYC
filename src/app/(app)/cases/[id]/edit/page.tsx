import { notFound, redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { prisma } from '@/lib/db';
import { canEditCase } from '@/lib/workflow';
import { profileToForm } from '@/lib/cases/mappers';
import { corporateProfileToForm } from '@/lib/cases/corporate-mappers';
import { getCountryOptions, getFatfSettings } from '@/lib/cases/queries';
import { KycWizard } from '@/components/kyc/wizard';
import { CorporateWizard } from '@/components/corporate/corporate-wizard';
import type { CaseStatus, DocType } from '@/lib/constants';

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['FRONT_OFFICE']);
  const { id } = await params;
  const { dict } = await getDict();

  const kase = await prisma.kycCase.findUnique({
    where: { id },
    include: { profile: true, corporateProfile: true, documents: true },
  });
  const isCorporate = kase?.clientType === 'CORPORATE';
  if (!kase || (isCorporate ? !kase.corporateProfile : !kase.profile)) notFound();

  const isMaker = kase.makerId === session.userId;
  if (!canEditCase(kase.status as CaseStatus, session.role, isMaker)) {
    redirect(`/cases/${id}`);
  }

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
      {isCorporate ? (
        <CorporateWizard
          caseId={kase.id}
          initialValues={corporateProfileToForm(kase.corporateProfile!, {
            formType: kase.formType,
            clientNo: kase.clientNo,
          })}
          countries={countries}
          initialDocs={initialDocs}
          fatfSettings={fatfSettings}
          returnedNotes={returnedNotes}
        />
      ) : (
        <KycWizard
          caseId={kase.id}
          initialValues={profileToForm(kase.profile!, { formType: kase.formType, clientNo: kase.clientNo })}
          countries={countries}
          initialDocs={initialDocs}
          fatfSettings={fatfSettings}
          returnedNotes={returnedNotes}
        />
      )}
    </div>
  );
}
