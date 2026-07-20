'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/client';
import { formatDateTime } from '@/lib/utils';
import type { AuditAction } from '@/lib/constants';
import { TONE_DOT, TONE_DOT_STRONG, type Tone } from '@/lib/theme/tones';

export interface TimelineEntry {
  id: string;
  action: AuditAction;
  actorName: string | null;
  notes: string | null;
  createdAt: string;
  /** Set only when this timeline mixes entries from multiple cases (e.g. a dashboard-wide feed). */
  caseRef?: string;
  caseHref?: string;
}

const ACTION_TONE: Partial<Record<AuditAction, Tone>> = {
  CASE_CREATED: 'slate',
  CASE_SUBMITTED: 'blue',
  COMPLIANCE_APPROVED: 'green',
  COMPLIANCE_ESCALATED: 'violet',
  COMPLIANCE_REJECTED: 'red',
  COMPLIANCE_RETURNED: 'amber',
  MANAGER_APPROVED: 'green',
  MANAGER_REJECTED: 'red',
  RISK_OVERRIDDEN: 'amber',
};
// Manager-level decisions get the one-shade-darker dot so they read as
// distinct from the equivalent compliance-level action at a glance.
const ACTION_STRONG = new Set<AuditAction>(['MANAGER_APPROVED', 'MANAGER_REJECTED']);

export function AuditTimeline({ entries }: { entries: TimelineEntry[] }) {
  const { dict, locale } = useI18n();
  if (entries.length === 0) return null;

  return (
    <ol className="space-y-4">
      {entries.map((e) => {
        const tone = ACTION_TONE[e.action] ?? 'slate';
        const dotColor = ACTION_STRONG.has(e.action) ? TONE_DOT_STRONG[tone] : TONE_DOT[tone];
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-card ${dotColor}`} />
              <span className="mt-1 w-px flex-1 bg-hairline" />
            </div>
            <div className="pb-1">
              <p className="text-sm font-medium text-ink">
                {dict.audit[e.action] ?? e.action}
                {e.caseRef && (
                  e.caseHref ? (
                    <Link href={e.caseHref} className="ms-1.5 font-semibold text-primary hover:underline">
                      {e.caseRef}
                    </Link>
                  ) : (
                    <span className="ms-1.5 font-semibold text-muted">{e.caseRef}</span>
                  )
                )}
              </p>
              <p className="text-xs text-faint">
                {e.actorName && <span>{e.actorName} · </span>}
                {formatDateTime(e.createdAt, locale)}
              </p>
              {e.notes && (
                <p className="mt-1 rounded-md bg-subtle px-2 py-1 text-xs text-muted">{e.notes}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
