'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Input } from '@/components/ui/input';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { StatusBadge, RiskBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import type { CaseStatus, RiskRating } from '@/lib/constants';

export interface CaseRow {
  id: string;
  caseNumber: string;
  clientName: string | null;
  formType: string;
  status: CaseStatus;
  finalRiskRating: RiskRating | null;
  updatedAt: string;
  submittedAt: string | null;
}

export function CaseList({ cases, showSubmitted }: { cases: CaseRow[]; showSubmitted?: boolean }) {
  const { dict, locale } = useI18n();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cases;
    return cases.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(needle) ||
        (c.clientName ?? '').toLowerCase().includes(needle),
    );
  }, [cases, q]);

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-faint" aria-hidden />
          <Input
            className="ps-9"
            placeholder={dict.common.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={dict.common.search}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-hairline bg-card/70 px-5 py-10 text-center text-sm text-muted backdrop-blur-sm">
          {dict.caseView.noCases}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-card/70 shadow-card backdrop-blur-sm">
          <Table>
            <THead>
              <Tr>
                <Th>{dict.caseView.caseNumber}</Th>
                <Th>{dict.caseView.client}</Th>
                <Th>{dict.fields.formType}</Th>
                <Th>{dict.risk.rating}</Th>
                <Th>{dict.caseView.status}</Th>
                <Th>{showSubmitted ? dict.caseView.submittedAt : dict.caseView.updatedAt}</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/cases/${c.id}`} className="font-semibold text-primary hover:underline">
                      {c.caseNumber}
                    </Link>
                  </Td>
                  <Td>{c.clientName || <span className="text-faint">—</span>}</Td>
                  <Td className="text-muted">{dict.formType[c.formType as 'NEW_CLIENT']}</Td>
                  <Td>
                    <RiskBadge rating={c.finalRiskRating} />
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td className="text-muted">
                    {formatDate(showSubmitted ? c.submittedAt : c.updatedAt, locale)}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
