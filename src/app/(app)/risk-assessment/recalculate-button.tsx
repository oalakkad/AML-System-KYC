'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { recalculateAllCra } from '@/lib/risk/cra-actions';

export function RecalculateButton() {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await recalculateAllCra();
      if (res.ok) {
        setMessage(interpolate(dict.riskAssessment.recalculated, { count: res.assessedCount ?? 0 }));
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" onClick={handleClick} loading={pending}>
        <RefreshCw className="size-4" aria-hidden />
        {pending ? dict.riskAssessment.recalculating : dict.riskAssessment.recalculateAll}
      </Button>
      {message && (
        <Alert tone="success" className="max-w-xs">
          {message}
        </Alert>
      )}
    </div>
  );
}
