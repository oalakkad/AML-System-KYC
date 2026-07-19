'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { decideCase } from '@/lib/cases/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

type Stage = 'compliance' | 'manager';

export function DecisionPanel({
  caseId,
  stage,
  isHighRisk,
}: {
  caseId: string;
  stage: Stage;
  isHighRisk: boolean;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: string) => {
    setError(null);
    const fd = new FormData();
    fd.set('caseId', caseId);
    fd.set('action', action);
    fd.set('notes', notes);
    startTransition(async () => {
      const res = await decideCase(fd);
      if (res.ok) {
        router.push(stage === 'compliance' ? '/review' : '/approvals');
        router.refresh();
      } else {
        setError(res.error === 'notesRequired' ? dict.caseView.notesRequiredReject : dict.common.error);
      }
    });
  };

  const approveAction = stage === 'compliance' ? 'COMPLIANCE_APPROVE' : 'MANAGER_APPROVE';
  const rejectAction = stage === 'compliance' ? 'COMPLIANCE_REJECT' : 'MANAGER_REJECT';

  return (
    <div className="space-y-4">
      {stage === 'compliance' && isHighRisk && <Alert tone="warning">{dict.caseView.escalateNote}</Alert>}
      <Field label={dict.caseView.decisionNotes} htmlFor="notes">
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </Field>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="success" onClick={() => run(approveAction)} loading={pending}>
          <CheckCircle2 className="size-4" aria-hidden />
          {dict.caseView.approve}
        </Button>
        <Button type="button" variant="danger" onClick={() => run(rejectAction)} loading={pending}>
          <XCircle className="size-4" aria-hidden />
          {dict.caseView.reject}
        </Button>
        {stage === 'compliance' && (
          <Button
            type="button"
            variant="warning"
            className="sm:col-span-2"
            onClick={() => run('COMPLIANCE_RETURN')}
            loading={pending}
          >
            <RotateCcw className="size-4" aria-hidden />
            {dict.caseView.returnForCorrection}
          </Button>
        )}
      </div>
    </div>
  );
}
