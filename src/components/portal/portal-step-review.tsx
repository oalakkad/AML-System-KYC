'use client';

// Final step of the client self-service KYC wizard: required-documents
// checklist, upload, and declaration. Deliberately omits the risk score/
// rating/factors and the maker risk-override control that the staff-side
// StepReview shows — those stay compliance-internal, never shown to the
// client filling in their own KYC.

import { Controller, useFormContext } from 'react-hook-form';
import { useI18n } from '@/lib/i18n/client';
import { CheckboxRow, SectionTitle, errMsg } from '@/components/kyc/shared';
import { PortalDocumentsPanel } from './portal-documents-panel';
import type { DocItem } from '@/components/kyc/documents-panel';
import type { KycFormValues } from '@/lib/cases/schemas';

export function PortalStepReview({
  caseId,
  docs,
  onDocsChange,
}: {
  caseId: string;
  docs: DocItem[];
  onDocsChange: (docs: DocItem[]) => void;
}) {
  const { dict } = useI18n();
  const {
    control,
    formState: { errors },
  } = useFormContext<KycFormValues>();
  const err = (name: string) => errMsg(errors, name, dict);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SectionTitle>{dict.fields.docsChecklistTitle}</SectionTitle>
        <Controller
          control={control}
          name="docCivilIdSighted"
          render={({ field }) => (
            <CheckboxRow
              id="docCivilIdSighted"
              label={dict.fields.docCivilId}
              checked={field.value}
              onChange={field.onChange}
              error={err('docCivilIdSighted')}
            />
          )}
        />
        <Controller
          control={control}
          name="docBeneficiaryDeclaration"
          render={({ field }) => (
            <CheckboxRow
              id="docBeneficiaryDeclaration"
              label={dict.fields.docBeneficialOwnerDecl}
              checked={field.value}
              onChange={field.onChange}
              error={err('docBeneficiaryDeclaration')}
            />
          )}
        />
        <Controller
          control={control}
          name="docSalaryCertificate"
          render={({ field }) => (
            <CheckboxRow
              id="docSalaryCertificate"
              label={dict.fields.docSalaryCert}
              checked={field.value}
              onChange={field.onChange}
              error={err('docSalaryCertificate')}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <SectionTitle>{dict.fields.attachments}</SectionTitle>
        <PortalDocumentsPanel caseId={caseId} docs={docs} onChange={onDocsChange} />
      </div>

      <div className="space-y-3 rounded-xl border border-hairline bg-subtle p-4">
        <SectionTitle>{dict.fields.declarationTitle}</SectionTitle>
        <p className="max-h-48 overflow-y-auto text-xs leading-relaxed text-slate-600">
          {dict.fields.declarationText}
        </p>
        <Controller
          control={control}
          name="declarationAccepted"
          render={({ field }) => (
            <CheckboxRow
              id="declarationAccepted"
              label={dict.fields.declarationAccept}
              checked={field.value}
              onChange={field.onChange}
              error={err('declarationAccepted')}
            />
          )}
        />
      </div>
    </div>
  );
}
