import Link from 'next/link';
import { getDict } from '@/lib/i18n';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/field';
import { formatDateTime } from '@/lib/utils';
import { AUDIT_ACTIONS, type AuditAction } from '@/lib/constants';
import type { AuditLogFilters, getAuditLogs } from '@/lib/settings/queries';

export async function AuditLogPanel({
  filters,
  result,
}: {
  filters: AuditLogFilters;
  result: Awaited<ReturnType<typeof getAuditLogs>>;
}) {
  const { dict, locale } = await getDict();
  const qs = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    params.set('tab', 'audit');
    const merged = { action: filters.action, from: filters.from, to: filters.to, page: filters.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') params.set(k, String(v));
    }
    return `/settings?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <form action="/settings" method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value="audit" />
            <div>
              <Label htmlFor="audit-filter-action">{dict.settings.audit.filterAction}</Label>
              <Select id="audit-filter-action" name="action" defaultValue={filters.action ?? ''}>
                <option value="">{dict.settings.audit.allActions}</option>
                {AUDIT_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {dict.audit[a]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="audit-filter-from">{dict.settings.audit.filterFrom}</Label>
              <Input id="audit-filter-from" type="date" name="from" defaultValue={filters.from ?? ''} />
            </div>
            <div>
              <Label htmlFor="audit-filter-to">{dict.settings.audit.filterTo}</Label>
              <Input id="audit-filter-to" type="date" name="to" defaultValue={filters.to ?? ''} />
            </div>
            <Button type="submit" size="sm">
              {dict.settings.audit.apply}
            </Button>
            <Link href="/settings?tab=audit">
              <Button type="button" variant="ghost" size="sm">
                {dict.settings.audit.clear}
              </Button>
            </Link>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={dict.settings.audit.title} />
        <CardBody className="p-0">
          {result.rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{dict.settings.audit.noResults}</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>{dict.settings.audit.when}</Th>
                  <Th>{dict.settings.audit.who}</Th>
                  <Th>{dict.settings.audit.action}</Th>
                  <Th>{dict.settings.audit.case}</Th>
                  <Th>{dict.settings.audit.details}</Th>
                </Tr>
              </THead>
              <TBody>
                {result.rows.map((l) => {
                  const who = l.actor
                    ? (locale === 'ar' ? l.actor.nameAr : l.actor.nameEn) || l.actor.email
                    : l.clientActor
                      ? (locale === 'ar' ? l.clientActor.nameAr : l.clientActor.nameEn) || l.clientActor.email
                      : '—';
                  let detail = '';
                  try {
                    detail = l.detailsJson ? JSON.stringify(JSON.parse(l.detailsJson)) : '';
                  } catch {
                    detail = '';
                  }
                  return (
                    <Tr key={l.id}>
                      <Td className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt, locale)}</Td>
                      <Td>{who}</Td>
                      <Td>{dict.audit[l.action as AuditAction] ?? l.action}</Td>
                      <Td className="whitespace-nowrap text-xs">{l.case?.caseNumber ?? '—'}</Td>
                      <Td className="max-w-xs truncate text-xs text-faint" title={detail}>
                        {detail}
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {result.pageCount > 1 && (
        <div className="flex items-center justify-between">
          {filters.page <= 1 ? (
            <Button variant="secondary" size="sm" disabled>
              {dict.settings.audit.previous}
            </Button>
          ) : (
            <Link href={qs({ page: filters.page - 1 })}>
              <Button variant="secondary" size="sm">
                {dict.settings.audit.previous}
              </Button>
            </Link>
          )}
          <span className="text-xs text-faint">
            {dict.settings.audit.pageOf
              .replace('{current}', String(filters.page))
              .replace('{total}', String(result.pageCount))}
          </span>
          {filters.page >= result.pageCount ? (
            <Button variant="secondary" size="sm" disabled>
              {dict.settings.audit.next}
            </Button>
          ) : (
            <Link href={qs({ page: filters.page + 1 })}>
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
