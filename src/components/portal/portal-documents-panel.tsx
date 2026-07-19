'use client';

// Client-portal document list/upload. Mirrors components/kyc/documents-panel.tsx
// but posts to the client-scoped uploadClientDocument action and never allows
// deletion — clients may add supporting evidence, not remove what's on file.

import { useRef, useState, useTransition } from 'react';
import { FileText, Download, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { uploadClientDocument } from '@/lib/portal/actions';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DOC_TYPES, type DocType, MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_MIME } from '@/lib/constants';
import type { DocItem } from '@/components/kyc/documents-panel';

export function PortalDocumentsPanel({
  caseId,
  docs,
  onChange,
  disabled,
  fixedDocType,
}: {
  caseId: string;
  docs: DocItem[];
  onChange: (docs: DocItem[]) => void;
  disabled?: boolean;
  /** lock the doc type selector (e.g. SOURCE_OF_FUNDS in the FATF dialog) */
  fixedDocType?: DocType;
}) {
  const { dict } = useI18n();
  const [docType, setDocType] = useState<DocType>(fixedDocType ?? 'CIVIL_ID');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleDocs = fixedDocType ? docs.filter((d) => d.docType === fixedDocType) : docs;

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(dict.validation.fileTooLarge);
      return;
    }
    if (!(ALLOWED_UPLOAD_MIME as readonly string[]).includes(file.type)) {
      setError(dict.validation.fileTypeNotAllowed);
      return;
    }
    const fd = new FormData();
    fd.set('caseId', caseId);
    fd.set('docType', fixedDocType ?? docType);
    fd.set('file', file);
    startTransition(async () => {
      const res = await uploadClientDocument(fd);
      if (res.ok && res.doc) {
        onChange([...docs, { ...res.doc, sizeBytes: file.size }]);
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setError(
          res.error === 'fileTooLarge'
            ? dict.validation.fileTooLarge
            : res.error === 'fileTypeNotAllowed'
              ? dict.validation.fileTypeNotAllowed
              : dict.common.error,
        );
      }
    });
  };

  return (
    <div className="space-y-3">
      {visibleDocs.length === 0 ? (
        <p className="text-sm text-muted">{dict.caseView.noDocuments}</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
          {visibleDocs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 bg-white px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-faint" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{d.fileName}</p>
                <Badge tone={d.docType === 'SOURCE_OF_FUNDS' ? 'amber' : 'slate'} className="mt-0.5">
                  {dict.options.docType[d.docType as DocType] ?? d.docType}
                </Badge>
              </div>
              <a
                href={`/api/documents/${d.id}`}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-subtle hover:text-primary"
                aria-label={dict.common.download}
              >
                <Download className="size-4" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-hairline-strong bg-subtle p-3 sm:flex-row sm:items-center">
          {!fixedDocType && (
            <Select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
              className="sm:w-56"
              aria-label={dict.fields.docType}
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {dict.options.docType[t]}
                </option>
              ))}
            </Select>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="flex-1 cursor-pointer text-sm text-muted file:me-3 file:cursor-pointer file:rounded-md file:border file:border-hairline-strong file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
            aria-label={dict.fields.attachDocument}
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleUpload} loading={pending}>
            <Upload className="size-4" aria-hidden />
            {pending ? dict.common.uploading : dict.common.upload}
          </Button>
        </div>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
