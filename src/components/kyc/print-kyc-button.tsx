'use client';

// Prints the KycPrintForm rendered elsewhere on the same page via the
// browser's native print dialog — same window.print() approach as
// reports-analytics/export-pdf-button.tsx.

import { Printer } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';

export function PrintKycButton() {
  const { dict } = useI18n();
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden />
      {dict.caseView.printForm}
    </Button>
  );
}
