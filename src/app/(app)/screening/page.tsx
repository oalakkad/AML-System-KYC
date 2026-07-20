import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getScreeningListStatus } from '@/lib/screening/queries';
import { ScreeningTool } from './screening-tool';

export default async function ScreeningPage() {
  await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict } = await getDict();
  const lists = await getScreeningListStatus();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{dict.screening.listScreeningTitle}</h1>
        <p className="mt-1 text-sm text-muted">{dict.screening.listScreeningSubtitle}</p>
      </div>
      <ScreeningTool lists={lists} />
    </div>
  );
}
