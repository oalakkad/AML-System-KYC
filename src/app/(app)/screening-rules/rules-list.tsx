'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateRuleStatus } from '@/lib/transactions/actions';
import type { RuleStatus, RulePriority } from '@/lib/constants';

interface RuleRow {
  id: string;
  name: string;
  ruleType: string;
  priority: string;
  status: string;
  createdBy: { nameEn: string; nameAr: string } | null;
}

const STATUS_TONE: Record<RuleStatus, 'slate' | 'green' | 'amber'> = {
  DRAFT: 'slate',
  ACTIVE: 'green',
  DISABLED: 'amber',
};

export function RulesList({ rules }: { rules: RuleRow[] }) {
  const { dict, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setStatus = (ruleId: string, status: RuleStatus) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('ruleId', ruleId);
      fd.set('status', status);
      await updateRuleStatus(fd);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader title={`${dict.screeningRules.rulesTitle} (${rules.length})`} />
      <CardBody className="p-0">
        {rules.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{dict.screeningRules.noRules}</p>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th className="text-start">{dict.screeningRules.ruleName}</Th>
                <Th>{dict.screeningRules.ruleType}</Th>
                <Th>{dict.screeningRules.priority}</Th>
                <Th>{dict.settings.users.status}</Th>
                <Th className="text-start">{dict.screeningRules.createdBy}</Th>
                <Th></Th>
              </Tr>
            </THead>
            <TBody>
              {rules.map((r) => (
                <Tr key={r.id}>
                  <Td className="text-start font-medium text-ink">{r.name}</Td>
                  <Td className="text-xs">{dict.screeningRules.ruleTypes[r.ruleType as keyof typeof dict.screeningRules.ruleTypes]}</Td>
                  <Td>
                    <Badge tone="slate">{dict.riskAssessment.bands[r.priority as RulePriority]}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[r.status as RuleStatus]}>{r.status}</Badge>
                  </Td>
                  <Td className="text-start text-xs text-faint">
                    {r.createdBy ? (locale === 'ar' ? r.createdBy.nameAr : r.createdBy.nameEn) : '—'}
                  </Td>
                  <Td>
                    {r.status === 'DRAFT' && (
                      <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus(r.id, 'ACTIVE')}>
                        {dict.screeningRules.activate}
                      </Button>
                    )}
                    {r.status === 'ACTIVE' && (
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus(r.id, 'DISABLED')}>
                        {dict.screeningRules.disable}
                      </Button>
                    )}
                    {r.status === 'DISABLED' && (
                      <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus(r.id, 'ACTIVE')}>
                        {dict.screeningRules.activate}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
