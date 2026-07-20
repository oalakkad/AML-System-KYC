'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateAlertStatus } from '@/lib/transactions/actions';
import type { AlertStatus } from '@/lib/constants';

export function AlertRowActions({ alertId, status }: { alertId: string; status: AlertStatus }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState('');

  const setStatus = (next: AlertStatus) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('alertId', alertId);
      fd.set('status', next);
      fd.set('notes', notes);
      await updateAlertStatus(fd);
      router.refresh();
    });
  };

  if (status === 'RESOLVED' || status === 'DISMISSED') return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <Input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={dict.alerts.notesPlaceholder}
        className="h-8 w-48 px-2 text-xs"
      />
      <div className="flex gap-1.5">
        {status === 'OPEN' && (
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setStatus('IN_REVIEW')}>
            {dict.alerts.markInReview}
          </Button>
        )}
        <Button type="button" variant="success" size="sm" disabled={pending} onClick={() => setStatus('RESOLVED')}>
          {dict.alerts.resolve}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setStatus('DISMISSED')}>
          {dict.alerts.dismiss}
        </Button>
      </div>
    </div>
  );
}
