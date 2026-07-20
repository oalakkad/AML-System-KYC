import { Activity, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getTransactionStats, getRecentTransactions, getApprovedCasesForTxnEntry } from '@/lib/transactions/queries';
import { getCountryOptions } from '@/lib/cases/queries';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/stat-card';
import { formatDateTime } from '@/lib/utils';
import { RecordTransactionDialog } from './record-transaction-dialog';
import { ImportTransactionsDialog } from './import-transactions-dialog';
import { AutoRefresh } from './auto-refresh';
import type { TransactionStatus } from '@/lib/constants';

const STATUS_TONE: Record<TransactionStatus, 'green' | 'amber' | 'red'> = {
  SAFE: 'green',
  UNDER_REVIEW: 'amber',
  BLOCKED: 'red',
};

export default async function TransactionsPage() {
  await requireSession(['FRONT_OFFICE', 'COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict, locale } = await getDict();

  const [stats, recent, cases, countries] = await Promise.all([
    getTransactionStats(),
    getRecentTransactions(),
    getApprovedCasesForTxnEntry(),
    getCountryOptions(),
  ]);

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">{dict.transactions.title}</h1>
            <Badge tone="blue">{dict.transactions.autoRefreshing}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{dict.transactions.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <ImportTransactionsDialog />
          <RecordTransactionDialog cases={cases} countries={countries} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={dict.transactions.todayCount} value={stats.today} icon={Activity} tone="slate" />
        <StatCard label={dict.transactions.safePercent} value={`${stats.safePercent}%`} icon={CheckCircle2} tone="green" />
        <StatCard label={dict.transactions.underReview} value={stats.underReview} icon={Clock} tone="amber" />
        <StatCard label={dict.transactions.blocked} value={stats.blocked} icon={ShieldAlert} tone="red" />
      </div>

      <Card>
        <CardHeader title={dict.transactions.liveFeedTitle} />
        <CardBody className="p-0">
          {recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{dict.transactions.noTransactions}</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>{dict.transactions.time}</Th>
                  <Th className="text-start">{dict.transactions.reference}</Th>
                  <Th className="text-start">{dict.transactions.client}</Th>
                  <Th>{dict.transactions.type}</Th>
                  <Th>{dict.transactions.amount}</Th>
                  <Th>{dict.transactions.counterparty}</Th>
                  <Th>{dict.transactions.status}</Th>
                </Tr>
              </THead>
              <TBody>
                {recent.map((t) => {
                  const clientName = t.case.profile?.fullName ?? t.case.corporateProfile?.legalName ?? t.case.caseNumber;
                  return (
                    <Tr key={t.id}>
                      <Td className="whitespace-nowrap text-xs">{formatDateTime(t.createdAt, locale)}</Td>
                      <Td dir="ltr" className="text-start text-xs">
                        {t.txnRef}
                      </Td>
                      <Td className="text-start">{clientName}</Td>
                      <Td className="text-xs">{dict.transactionTypes[t.type as keyof typeof dict.transactionTypes]}</Td>
                      <Td className="tnum">{t.amountKd.toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-KW')}</Td>
                      <Td className="text-xs text-faint">{t.counterpartyName ?? '—'}</Td>
                      <Td>
                        <Badge tone={STATUS_TONE[t.status as TransactionStatus]}>
                          {dict.transactionStatuses[t.status as keyof typeof dict.transactionStatuses]}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
