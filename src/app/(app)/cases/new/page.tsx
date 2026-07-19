import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { createCase } from '@/lib/cases/actions';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NewCaseForm } from './new-case-form';
import type { ClientType } from '@/lib/constants';

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireSession(['FRONT_OFFICE']);
  const { dict } = await getDict();
  const { type } = await searchParams;
  const initialClientType: ClientType = type === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader
          title={initialClientType === 'CORPORATE' ? dict.nav.newCorporateCase : dict.nav.newCase}
          description={dict.common.kycModule}
        />
        <CardBody>
          <NewCaseForm action={createCase} initialClientType={initialClientType} />
        </CardBody>
      </Card>
    </div>
  );
}
