import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getTotalSanctionedEntityCount, browseSanctionedEntities } from '@/lib/screening/queries';
import { Card, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default async function SanctionsListsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict } = await getDict();
  const { q, page: pageParam } = await searchParams;
  const query = q ?? '';
  const page = Number(pageParam ?? '1') || 1;

  const [total, result] = await Promise.all([getTotalSanctionedEntityCount(), browseSanctionedEntities(query, page)]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{dict.screening.listsPageTitle}</h1>
        <p className="mt-1 text-sm text-muted">{dict.screening.listsPageSubtitle}</p>
      </div>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold tnum text-ink">{total}</p>
            <p className="text-xs text-muted">{dict.screening.totalRecords}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form action="/sanctions-lists" method="get" className="flex gap-3">
            <Input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={dict.screening.searchByName}
              className="flex-1"
              dir="ltr"
            />
            <Button type="submit" size="sm">
              {dict.screening.search}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {result.rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{dict.screening.noResults}</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>{dict.screening.name}</Th>
                  <Th>{dict.screening.listSource}</Th>
                  <Th>{dict.screening.program}</Th>
                  <Th>{dict.screening.nationality}</Th>
                </Tr>
              </THead>
              <TBody>
                {result.rows.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium text-ink">{r.fullName}</Td>
                    <Td>
                      <Badge tone="slate">{r.listSource}</Badge>
                    </Td>
                    <Td className="text-xs">{r.programs}</Td>
                    <Td className="text-xs text-faint">{r.nationality ?? '—'}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {result.pageCount > 1 && (
        <div className="flex items-center justify-between">
          {page <= 1 ? (
            <Button variant="secondary" size="sm" disabled>
              {dict.settings.audit.previous}
            </Button>
          ) : (
            <Link href={`/sanctions-lists?q=${encodeURIComponent(query)}&page=${page - 1}`}>
              <Button variant="secondary" size="sm">
                {dict.settings.audit.previous}
              </Button>
            </Link>
          )}
          <span className="text-xs text-faint">
            {dict.settings.audit.pageOf.replace('{current}', String(page)).replace('{total}', String(result.pageCount))}
          </span>
          {page >= result.pageCount ? (
            <Button variant="secondary" size="sm" disabled>
              {dict.settings.audit.next}
            </Button>
          ) : (
            <Link href={`/sanctions-lists?q=${encodeURIComponent(query)}&page=${page + 1}`}>
              <Button variant="secondary" size="sm">
                {dict.settings.audit.next}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
