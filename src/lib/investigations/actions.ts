'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { INVESTIGATION_STATUSES } from '@/lib/constants';

async function nextInvestigationRef(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.investigationCounter.upsert({
    where: { year },
    create: { year, counter: 1 },
    update: { counter: { increment: 1 } },
  });
  return `INV-${year}-${String(counter.counter).padStart(5, '0')}`;
}

export interface SimpleResult {
  ok?: boolean;
  error?: string;
}

export async function escalateAlertToCase(formData: FormData): Promise<SimpleResult> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const alertId = String(formData.get('alertId') ?? '');
  if (!alertId) return { error: 'invalidInput' };

  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: { transaction: { select: { caseId: true } }, investigationCase: true },
  });
  if (!alert) return { error: 'notFound' };
  if (alert.investigationCase) return { error: 'alreadyEscalated' };

  const caseRef = await nextInvestigationRef();
  const investigation = await prisma.investigationCase.create({
    data: {
      caseRef,
      alertId: alert.id,
      kycCaseId: alert.transaction.caseId,
      openedById: session.userId,
    },
  });

  if (alert.status === 'OPEN') {
    await prisma.alert.update({ where: { id: alert.id }, data: { status: 'IN_REVIEW' } });
  }

  await logAudit({
    action: 'ALERT_ESCALATED',
    actorId: session.userId,
    caseId: alert.transaction.caseId,
    details: { alertId: alert.id, investigationId: investigation.id, caseRef },
  });

  revalidatePath('/investigations');
  revalidatePath('/alerts');
  return { ok: true };
}

export async function updateInvestigationStatus(formData: FormData): Promise<SimpleResult> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const investigationId = String(formData.get('investigationId') ?? '');
  const status = String(formData.get('status') ?? '');
  const findings = String(formData.get('findings') ?? '');
  if (!investigationId || !(INVESTIGATION_STATUSES as readonly string[]).includes(status)) {
    return { error: 'invalidInput' };
  }

  const before = await prisma.investigationCase.findUnique({ where: { id: investigationId } });
  if (!before) return { error: 'notFound' };

  await prisma.investigationCase.update({
    where: { id: investigationId },
    data: {
      status,
      findings: findings || undefined,
      ...(status === 'CLOSED' ? { closedById: session.userId, closedAt: new Date() } : {}),
    },
  });

  await logAudit({
    action: 'INVESTIGATION_STATUS_CHANGED',
    actorId: session.userId,
    caseId: before.kycCaseId,
    details: { investigationId, from: before.status, to: status },
  });

  revalidatePath('/investigations');
  return { ok: true };
}
