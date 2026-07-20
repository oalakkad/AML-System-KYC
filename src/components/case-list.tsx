'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Input, Select } from '@/components/ui/input';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { StatusBadge, RiskBadge } from '@/components/status-badge';
import { AvatarChip } from '@/components/ui/avatar-chip';
import { formatDate } from '@/lib/utils';
import { CASE_STATUSES, RISK_RATINGS, type CaseStatus, type RiskRating } from '@/lib/constants';

export interface CaseRow {
  id: string;
  caseNumber: string;
  clientName: string | null;
  clientType: 'INDIVIDUAL' | 'CORPORATE';
  formType: string;
  status: CaseStatus;
  finalRiskRating: RiskRating | null;
  updatedAt: string;
  submittedAt: string | null;
}

const PAGE_SIZE = 10;

export function CaseList({ cases, showSubmitted }: { cases: CaseRow[]; showSubmitted?: boolean }) {
  const { dict, locale } = useI18n();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<CaseStatus | 'ALL'>('ALL');
  const [risk, setRisk] = useState<RiskRating | 'ALL'>('ALL');
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'CORPORATE' | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (needle && !c.caseNumber.toLowerCase().includes(needle) && !(c.clientName ?? '').toLowerCase().includes(needle)) return false;
      if (status !== 'ALL' && c.status !== status) return false;
      if (risk !== 'ALL' && c.finalRiskRating !== risk) return false;
      if (clientType !== 'ALL' && c.clientType !== clientType) return false;
      return true;
    });
  }, [cases, q, status, risk, clientType]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetToPage1 = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-hairline p-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-faint" aria-hidden />
          <Input
            className="ps-9"
            placeholder={dict.common.search}
            value={q}
            onChange={(e) => resetToPage1(setQ)(e.target.value)}
            aria-label={dict.common.search}
          />
        </div>
        <Select
          className="w-auto"
          value={status}
          onChange={(e) => resetToPage1(setStatus)(e.target.value as CaseStatus | 'ALL')}
          aria-label={dict.caseView.status}
        >
          <option value="ALL">{dict.caseView.status}: {dict.common.all}</option>
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {dict.status[s]}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={risk}
          onChange={(e) => resetToPage1(setRisk)(e.target.value as RiskRating | 'ALL')}
          aria-label={dict.risk.rating}
        >
          <option value="ALL">{dict.risk.rating}: {dict.common.all}</option>
          {RISK_RATINGS.map((r) => (
            <option key={r} value={r}>
              {dict.risk[r]}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={clientType}
          onChange={(e) => resetToPage1(setClientType)(e.target.value as 'INDIVIDUAL' | 'CORPORATE' | 'ALL')}
          aria-label={dict.clientType.label}
        >
          <option value="ALL">{dict.clientType.label}: {dict.common.all}</option>
          <option value="INDIVIDUAL">{dict.clientType.INDIVIDUAL}</option>
          <option value="CORPORATE">{dict.clientType.CORPORATE}</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">{dict.caseView.noCases}</p>
      ) : (
        <>
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
              {paged.map((c) => {
                return (
                  <Tr key={c.id}>
                    <Td>
                      <Link href={`/cases/${c.id}`} className="font-semibold text-primary hover:underline">
                        {c.caseNumber}
                      </Link>
                    </Td>
                    <Td>
                      {c.clientName ? (
                        <span className="flex items-center gap-2.5">
                          <AvatarChip name={c.clientName} />
                          {c.clientName}
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </Td>
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
                );
              })}
            </TBody>
          </Table>

          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-hairline px-5 py-3.5">
              <p className="text-xs font-semibold text-muted">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex size-8 items-center justify-center rounded-lg border border-hairline text-muted transition-colors hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={dict.common.previous}
                >
                  <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
                </button>
                <span className="min-w-14 text-center text-xs font-bold tnum text-ink">
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  className="flex size-8 items-center justify-center rounded-lg border border-hairline text-muted transition-colors hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={dict.common.next}
                >
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
