import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import type { AuditAction, CaseStatus } from '@/lib/constants';

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
