'use client';

import { Construction } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardBody } from '@/components/ui/card';

export function ComingSoonPanel({ title }: { title: string }) {
  const { dict } = useI18n();
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
        <Construction className="size-10 text-faint" aria-hidden />
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-muted">{dict.settings.comingSoon}</p>
      </CardBody>
    </Card>
  );
}
