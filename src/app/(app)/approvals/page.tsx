import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { listCases } from '@/lib/cases/list';
import { CaseList } from '@/components/case-list';

export default async function ApprovalsQueuePage() {
  await requireSession(['SENIOR_MANAGER', 'ADMIN']);
  const { dict } = await getDict();
  const cases = await listCases({ status: 'PENDING_MANAGER' }, { submittedAt: 'asc' });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{dict.nav.approvalQueue}</h1>
        <p className="mt-1 text-sm text-muted">{dict.status.PENDING_MANAGER}</p>
      </div>
      <CaseList cases={cases} showSubmitted />
    </div>
  );
}
