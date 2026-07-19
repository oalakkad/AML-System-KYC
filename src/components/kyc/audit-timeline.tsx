'use client';

import { useI18n } from '@/lib/i18n/client';
import { formatDateTime } from '@/lib/utils';
import type { AuditAction } from '@/lib/constants';

export interface TimelineEntry {
  id: string;
  action: AuditAction;
  actorName: string | null;
  notes: string | null;
  createdAt: string;
}

const DOT_COLOR: Partial<Record<AuditAction, string>> = {
  CASE_CREATED: 'bg-slate-400',
  CASE_SUBMITTED: 'bg-blue-500',
  COMPLIANCE_APPROVED: 'bg-emerald-500',
  COMPLIANCE_ESCALATED: 'bg-violet-500',
  COMPLIANCE_REJECTED: 'bg-red-500',
  COMPLIANCE_RETURNED: 'bg-amber-500',
  MANAGER_APPROVED: 'bg-emerald-600',
  MANAGER_REJECTED: 'bg-red-600',
  RISK_OVERRIDDEN: 'bg-amber-500',
};

export function AuditTimeline({ entries }: { entries: TimelineEntry[] }) {
  const { dict, locale } = useI18n();
  if (entries.length === 0) return null;

  return (
    <ol className="space-y-4">
      {entries.map((e) => (
        <li key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-white ${DOT_COLOR[e.action] ?? 'bg-slate-500'}`} />
            <span className="mt-1 w-px flex-1 bg-hairline" />
          </div>
          <div className="pb-1">
            <p className="text-sm font-medium text-slate-800">
              {dict.audit[e.action] ?? e.action}
            </p>
            <p className="text-xs text-faint">
              {e.actorName && <span>{e.actorName} · </span>}
              {formatDateTime(e.createdAt, locale)}
            </p>
            {e.notes && (
              <p className="mt-1 rounded-md bg-subtle px-2 py-1 text-xs text-slate-600">{e.notes}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
