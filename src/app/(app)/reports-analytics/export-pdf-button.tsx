'use client';

// "Export PDF" via the browser's native print-to-PDF — a real, working export
// with no new server-side rendering dependency. The sidebar/header are marked
// print:hidden (see app-shell.tsx) so the printed/saved output is just this
// report's content.

import { Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';

export function ExportPdfButton() {
  const { dict } = useI18n();
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Download className="size-4" aria-hidden />
      {dict.reports.exportPdf}
    </Button>
  );
}
