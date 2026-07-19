import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { listCases } from '@/lib/cases/list';
import { frontOfficeScopedWhere } from '@/lib/cases/queries';
import { CaseList } from '@/components/case-list';
import { Button } from '@/components/ui/button';

export default async function CasesPage() {
  const session = await requireSession();
  const { dict } = await getDict();
  const where = frontOfficeScopedWhere(session.role, session.userId);
  const cases = await listCases(where);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">
          {session.role === 'FRONT_OFFICE' ? dict.nav.myCases : dict.nav.allCases}
        </h1>
        {session.role === 'FRONT_OFFICE' && (
          <Link href="/cases/new">
            <Button size="sm">
              <Plus className="size-4" aria-hidden />
              {dict.caseView.newCase}
            </Button>
          </Link>
        )}
      </div>
      <CaseList cases={cases} />
    </div>
  );
}
