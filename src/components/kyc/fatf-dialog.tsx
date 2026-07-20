'use client';

// Mandatory popup shown when a selected country is FATF grey/black listed.
// Requires a source-of-funds document to be attached before it can be dismissed.

import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentsPanel, type DocItem } from './documents-panel';
import type { CountryOption } from './shared';

export interface FatfFlag {
  field: string;
  countryCode: string;
  fatfStatus: string;
}

export function FatfDialog({
  open,
  onClose,
  caseId,
  flags,
  countries,
  docs,
  onDocsChange,
}: {
  open: boolean;
  onClose: () => void;
  caseId: string;
  flags: FatfFlag[];
  countries: CountryOption[];
  docs: DocItem[];
  onDocsChange: (docs: DocItem[]) => void;
}) {
  const { dict, locale } = useI18n();
  const hasBlack = flags.some((f) => f.fatfStatus === 'BLACK');
  const hasSourceDoc = docs.some((d) => d.docType === 'SOURCE_OF_FUNDS');
  const nameOf = (code: string) => {
    const c = countries.find((x) => x.code === code);
    return c ? (locale === 'ar' ? c.nameAr : c.nameEn) : code;
  };
  const uniqueCodes = [...new Set(flags.map((f) => f.countryCode))];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={hasSourceDoc}
      title={
        <span className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="size-5" aria-hidden />
          {dict.fatf.modalTitle}
        </span>
      }
    >
      <div className="space-y-4">
        <Alert tone={hasBlack ? 'danger' : 'warning'}>
          {hasBlack ? dict.fatf.modalBlack : dict.fatf.modalGrey}
        </Alert>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">{dict.fatf.flaggedCountries}</p>
          <div className="flex flex-wrap gap-2">
            {uniqueCodes.map((code) => {
              const isBlack = flags.some((f) => f.countryCode === code && f.fatfStatus === 'BLACK');
              return (
                <Badge key={code} tone={isBlack ? 'red' : 'amber'}>
                  {nameOf(code)}
                </Badge>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">{dict.fatf.uploadNow}</p>
          <DocumentsPanel
            caseId={caseId}
            docs={docs}
            onChange={onDocsChange}
            fixedDocType="SOURCE_OF_FUNDS"
          />
        </div>

        {hasSourceDoc ? (
          <Alert tone="success">{dict.fatf.docAttached}</Alert>
        ) : (
          <p className="text-xs text-muted">{dict.fatf.docMissing}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant={hasSourceDoc ? 'primary' : 'secondary'} onClick={onClose}>
            {hasSourceDoc ? dict.common.confirm : dict.fatf.uploadLater}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
