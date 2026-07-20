import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import type { AuditAction, CaseStatus } from '@/lib/constants';
import type { TimelineEntry } from '@/components/kyc/audit-timeline';

/** Same "worth surfacing" action set as the per-case timeline (src/app/(app)/cases/[id]/page.tsx). */
const NOTABLE_ACTIONS: AuditAction[] = [
  'CASE_CREATED',
  'CASE_SUBMITTED',
  'RISK_OVERRIDDEN',
  'COMPLIANCE_APPROVED',
  'COMPLIANCE_REJECTED',
  'COMPLIANCE_RETURNED',
  'COMPLIANCE_ESCALATED',
  'MANAGER_APPROVED',
  'MANAGER_REJECTED',
];

export interface AuditEntry {
  action: AuditAction;
  caseId?: string | null;
  actorId?: string | null;
  clientActorId?: string | null;
  fromStatus?: CaseStatus | null;
  toStatus?: CaseStatus | null;
  details?: Record<string, unknown>;
}

/** Append-only audit log. Never throws — auditing must not break the main flow. */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
    } catch {
      // headers() unavailable outside a request scope
    }
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        caseId: entry.caseId ?? null,
        actorId: entry.actorId ?? null,
        clientActorId: entry.clientActorId ?? null,
        fromStatus: entry.fromStatus ?? null,
        toStatus: entry.toStatus ?? null,
        detailsJson: entry.details ? JSON.stringify(entry.details) : null,
        ip,
      },
    });
  } catch (err) {
    console.error('Audit log write failed', err);
  }
}

/** Dashboard-wide activity feed — same notable actions as the per-case timeline, across all cases. */
export async function getRecentActivity(locale: 'en' | 'ar', limit = 6): Promise<TimelineEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: NOTABLE_ACTIONS } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: { select: { nameEn: true, nameAr: true } },
      clientActor: { select: { nameEn: true, nameAr: true } },
      case: { select: { id: true, caseNumber: true } },
    },
  });

  return logs.map((l) => {
    let notes: string | null = null;
    try {
      notes = l.detailsJson ? (JSON.parse(l.detailsJson).notes ?? null) : null;
    } catch {
      notes = null;
    }
    const actorName = l.actor
      ? (locale === 'ar' ? l.actor.nameAr : l.actor.nameEn)
      : l.clientActor
        ? (locale === 'ar' ? l.clientActor.nameAr : l.clientActor.nameEn)
        : null;
    return {
      id: l.id,
      action: l.action as AuditAction,
      actorName,
      notes,
      createdAt: l.createdAt.toISOString(),
      caseRef: l.case?.caseNumber,
      caseHref: l.case ? `/cases/${l.case.id}` : undefined,
    };
  });
}
