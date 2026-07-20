import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { listCases } from '@/lib/cases/list';
import { CaseList } from '@/components/case-list';

export default async function ReviewQueuePage() {
  await requireSession(['COMPLIANCE_OFFICER', 'ADMIN']);
  const { dict } = await getDict();
  const cases = await listCases({ status: 'PENDING_COMPLIANCE' }, { submittedAt: 'asc' });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{dict.nav.reviewQueue}</h1>
        <p className="mt-1 text-sm text-muted">{dict.status.PENDING_COMPLIANCE}</p>
      </div>
      <CaseList cases={cases} showSubmitted />
    </div>
  );
}
