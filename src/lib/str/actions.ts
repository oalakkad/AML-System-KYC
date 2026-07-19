'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { STR_STATUSES } from '@/lib/constants';

async function nextStrRef(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.strCounter.upsert({
    where: { year },
    create: { year, counter: 1 },
    update: { counter: { increment: 1 } },
  });
  return `STR-${year}-${String(counter.counter).padStart(5, '0')}`;
}

const createStrSchema = z.object({
  kycCaseId: z.string().min(1),
  investigationCaseId: z.string().optional().or(z.literal('')),
  narrative: z.string().trim().max(5000).optional().or(z.literal('')),
});

export interface CreateStrState {
  ok?: boolean;
  error?: 'invalidInput' | 'caseNotFound';
}

export async function createStrReport(_prev: CreateStrState, formData: FormData): Promise<CreateStrState> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const parsed = createStrSchema.safeParse({
    kycCaseId: formData.get('kycCaseId'),
    investigationCaseId: formData.get('investigationCaseId'),
    narrative: formData.get('narrative'),
  });
  if (!parsed.success) return { error: 'invalidInput' };
  const data = parsed.data;

  const kase = await prisma.kycCase.findUnique({ where: { id: data.kycCaseId } });
  if (!kase) return { error: 'caseNotFound' };

  const reportRef = await nextStrRef();
  const report = await prisma.strReport.create({
    data: {
      reportRef,
      kycCaseId: data.kycCaseId,
      investigationCaseId: data.investigationCaseId || null,
      narrative: data.narrative || null,
      preparedById: session.userId,
    },
  });

  await logAudit({
    action: 'STR_CREATED',
    actorId: session.userId,
    caseId: data.kycCaseId,
    details: { reportRef, strId: report.id },
  });

  revalidatePath('/str-reports');
  return { ok: true };
}

export interface SimpleResult {
  ok?: boolean;
  error?: string;
}

export async function updateStrStatus(formData: FormData): Promise<SimpleResult> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const strId = String(formData.get('strId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!strId || !(STR_STATUSES as readonly string[]).includes(status)) return { error: 'invalidInput' };

  const before = await prisma.strReport.findUnique({ where: { id: strId } });
  if (!before) return { error: 'notFound' };

  await prisma.strReport.update({
    where: { id: strId },
    data: { status, ...(status === 'SUBMITTED' ? { submittedAt: new Date() } : {}) },
  });

  await logAudit({
    action: 'STR_STATUS_CHANGED',
    actorId: session.userId,
    caseId: before.kycCaseId,
    details: { strId, from: before.status, to: status },
  });

  revalidatePath('/str-reports');
  return { ok: true };
}
