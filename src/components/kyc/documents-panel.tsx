'use client';

import { useRef, useState, useTransition } from 'react';
import { FileText, Trash2, Download, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { uploadDocument, deleteDocument } from '@/lib/cases/actions';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { FileInput } from '@/components/ui/file-input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DOC_TYPES, type DocType, MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_MIME } from '@/lib/constants';

export interface DocItem {
  id: string;
  docType: string;
  fileName: string;
  sizeBytes: number;
}

export function DocumentsPanel({
  caseId,
  docs,
  onChange,
  fixedDocType,
  readOnly,
}: {
  caseId: string;
  docs: DocItem[];
  /** omit in readOnly mode (Server Components cannot pass function props) */
  onChange?: (docs: DocItem[]) => void;
  /** lock the doc type selector (e.g. SOURCE_OF_FUNDS in the FATF dialog) */
  fixedDocType?: DocType;
  readOnly?: boolean;
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
      const res = await uploadDocument(fd);
      if (res.ok && res.doc) {
        onChange?.([...docs, { ...res.doc, sizeBytes: file.size }]);
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

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteDocument(id);
      if (res.ok) onChange?.(docs.filter((d) => d.id !== id));
    });
  };

  return (
    <div className="space-y-3">
      {visibleDocs.length === 0 ? (
        <p className="text-sm text-muted">{dict.caseView.noDocuments}</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
          {visibleDocs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 bg-card px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-faint" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{d.fileName}</p>
                <Badge tone={d.docType === 'SOURCE_OF_FUNDS' ? 'amber' : 'slate'} className="mt-0.5">
                  {dict.options.docType[d.docType as DocType] ?? d.docType}
                </Badge>
              </div>
              <span className="hidden text-xs text-faint sm:block">
                {(d.sizeBytes / 1024).toFixed(0)} KB
              </span>
              <a
                href={`/api/documents/${d.id}`}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-subtle hover:text-primary"
                aria-label={dict.common.download}
              >
                <Download className="size-4" aria-hidden />
              </a>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  disabled={pending}
                  className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label={dict.common.delete}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
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
          <FileInput
            ref={fileRef}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="flex-1"
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
