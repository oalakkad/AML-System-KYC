'use client';

import { useState } from 'react';
import { PortalDocumentsPanel } from '@/components/portal/portal-documents-panel';
import type { DocItem } from '@/components/kyc/documents-panel';

export function PortalCaseDocuments({
  caseId,
  initialDocs,
  disabled,
}: {
  caseId: string;
  initialDocs: DocItem[];
  disabled: boolean;
}) {
  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  return <PortalDocumentsPanel caseId={caseId} docs={docs} onChange={setDocs} disabled={disabled} />;
}
