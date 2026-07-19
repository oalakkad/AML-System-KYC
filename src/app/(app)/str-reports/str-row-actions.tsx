'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { updateStrStatus } from '@/lib/str/actions';
import type { StrStatus } from '@/lib/constants';

export function StrRowActions({ strId, status }: { strId: string; status: StrStatus }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setStatus = (next: StrStatus) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('strId', strId);
      fd.set('status', next);
      await updateStrStatus(fd);
      router.refresh();
    });
  };

  if (status === 'SUBMITTED') return null;

  return (
    <div className="flex gap-1.5">
      {status === 'IN_PREPARATION' && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus('UNDER_REVIEW')}>
          {dict.strReports.markUnderReview}
        </Button>
      )}
      {status === 'UNDER_REVIEW' && (
        <Button size="sm" variant="success" disabled={pending} onClick={() => setStatus('SUBMITTED')}>
          {dict.strReports.submitToFiu}
        </Button>
      )}
    </div>
  );
}
