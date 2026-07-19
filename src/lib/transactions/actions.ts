'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { evaluateRule, DEFAULT_ALERT_TYPE, type RuleParams, type VelocityCountSumParams, type LargeSingleTransactionParams, type HighRiskCountryParams } from './rules';
import {
  TRANSACTION_TYPES,
  RULE_TYPES,
  RULE_PRIORITIES,
  RULE_ACTIONS,
  ALERT_STATUSES,
  RULE_STATUSES,
  type FatfStatus,
  type TransactionType,
} from '@/lib/constants';

async function nextTxnRef(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.transactionCounter.upsert({
    where: { year },
    create: { year, counter: 1 },
    update: { counter: { increment: 1 } },
  });
  return `TXN-${year}-${String(counter.counter).padStart(6, '0')}`;
}

// ---------- record a transaction (manual entry — no core-banking feed exists) ----------

const recordTxnSchema = z.object({
  caseId: z.string().min(1),
  type: z.enum(TRANSACTION_TYPES),
  amountKd: z.coerce.number().positive(),
  counterpartyName: z.string().trim().max(200).optional().or(z.literal('')),
  counterpartyCountry: z.string().trim().optional().or(z.literal('')),
});

export interface RecordTransactionState {
  ok?: boolean;
  error?: 'invalidInput' | 'caseNotFound';
  alertCount?: number;
}

export async function recordTransaction(
  _prev: RecordTransactionState,
  formData: FormData,
): Promise<RecordTransactionState> {
  const session = await requireSession(['FRONT_OFFICE', 'COMPLIANCE_OFFICER', 'ADMIN']);
  const parsed = recordTxnSchema.safeParse({
    caseId: formData.get('caseId'),
    type: formData.get('type'),
    amountKd: formData.get('amountKd'),
    counterpartyName: formData.get('counterpartyName'),
    counterpartyCountry: formData.get('counterpartyCountry'),
  });
  if (!parsed.success) return { error: 'invalidInput' };
  const data = parsed.data;

  const kase = await prisma.kycCase.findUnique({ where: { id: data.caseId } });
  if (!kase) return { error: 'caseNotFound' };

  const txnRef = await nextTxnRef();
  const txn = await prisma.transaction.create({
    data: {
      caseId: data.caseId,
      txnRef,
      type: data.type,
      amountKd: data.amountKd,
      counterpartyName: data.counterpartyName || null,
      counterpartyCountry: data.counterpartyCountry || null,
      enteredById: session.userId,
    },
  });

  const [activeRules, priorTxns, countries] = await Promise.all([
    prisma.screeningRule.findMany({ where: { status: 'ACTIVE' } }),
    prisma.transaction.findMany({
      where: { caseId: data.caseId, id: { not: txn.id } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.country.findMany({ select: { code: true, fatfStatus: true } }),
  ]);
  const fatfByCode = new Map(countries.map((c) => [c.code, c.fatfStatus as FatfStatus]));

  let alertCount = 0;
  for (const rule of activeRules) {
    const ruleType = rule.ruleType as 'VELOCITY_COUNT_SUM' | 'LARGE_SINGLE_TRANSACTION' | 'HIGH_RISK_COUNTRY';
    const params = JSON.parse(rule.paramsJson) as RuleParams;
    const result = evaluateRule(ruleType, params, {
      transaction: {
        type: txn.type,
        amountKd: txn.amountKd,
        counterpartyCountry: txn.counterpartyCountry,
        createdAt: txn.createdAt,
      },
      priorTransactions: priorTxns.map((t) => ({
        type: t.type,
        amountKd: t.amountKd,
        counterpartyCountry: t.counterpartyCountry,
        createdAt: t.createdAt,
      })),
      fatfByCode,
    });
    if (result.matched) {
      await prisma.alert.create({
        data: {
          transactionId: txn.id,
          ruleId: rule.id,
          severity: rule.priority,
          alertType: DEFAULT_ALERT_TYPE[ruleType],
        },
      });
      alertCount++;
      await logAudit({
        action: 'ALERT_CREATED',
        actorId: session.userId,
        details: { ruleId: rule.id, ruleName: rule.name, transactionId: txn.id, txnRef },
      });
    }
  }

  if (alertCount > 0) {
    await prisma.transaction.update({ where: { id: txn.id }, data: { status: 'UNDER_REVIEW' } });
  }

  await logAudit({
    action: 'TRANSACTION_RECORDED',
    actorId: session.userId,
    caseId: data.caseId,
    details: { txnRef, amountKd: data.amountKd, type: data.type, alertCount },
  });

  revalidatePath('/transactions');
  revalidatePath('/alerts');
  return { ok: true, alertCount };
}

// ---------- screening rules ----------

const createRuleSchema = z.object({
  name: z.string().trim().min(1).max(200),
  ruleType: z.enum(RULE_TYPES),
  priority: z.enum(RULE_PRIORITIES),
  action: z.enum(RULE_ACTIONS),
  velocityTransactionType: z.string().optional().or(z.literal('')),
  windowHours: z.coerce.number().optional(),
  minCount: z.coerce.number().optional(),
  minAmountKd: z.coerce.number().optional(),
  maxAmountKd: z.coerce.number().optional(),
  largeTransactionType: z.string().optional().or(z.literal('')),
  thresholdAmountKd: z.coerce.number().optional(),
  includeGreylist: z.string().optional(),
  includeBlacklist: z.string().optional(),
});

export interface CreateRuleState {
  ok?: boolean;
  error?: 'invalidInput';
}

function buildRuleParams(data: z.infer<typeof createRuleSchema>): RuleParams {
  if (data.ruleType === 'VELOCITY_COUNT_SUM') {
    const params: VelocityCountSumParams = {
      transactionType: (data.velocityTransactionType || 'ANY') as TransactionType | 'ANY',
      windowHours: data.windowHours ?? 72,
      minCount: data.minCount ?? 5,
      minAmountKd: data.minAmountKd ?? 0,
      maxAmountKd: data.maxAmountKd ?? 999999,
    };
    return params;
  }
  if (data.ruleType === 'LARGE_SINGLE_TRANSACTION') {
    const params: LargeSingleTransactionParams = {
      transactionType: (data.largeTransactionType || 'ANY') as TransactionType | 'ANY',
      thresholdAmountKd: data.thresholdAmountKd ?? 10000,
    };
    return params;
  }
  const params: HighRiskCountryParams = {
    includeGreylist: data.includeGreylist === 'on',
    includeBlacklist: data.includeBlacklist === 'on',
  };
  return params;
}

export async function createScreeningRule(_prev: CreateRuleState, formData: FormData): Promise<CreateRuleState> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'ADMIN']);
  const parsed = createRuleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: 'invalidInput' };
  const data = parsed.data;
  const params = buildRuleParams(data);

  const rule = await prisma.screeningRule.create({
    data: {
      name: data.name,
      ruleType: data.ruleType,
      priority: data.priority,
      action: data.action,
      paramsJson: JSON.stringify(params),
      status: 'DRAFT',
      createdById: session.userId,
    },
  });

  await logAudit({
    action: 'RULE_CREATED',
    actorId: session.userId,
    details: { ruleId: rule.id, name: data.name, ruleType: data.ruleType },
  });

  revalidatePath('/screening-rules');
  return { ok: true };
}

export interface SimpleResult {
  ok?: boolean;
  error?: string;
}

export async function updateRuleStatus(formData: FormData): Promise<SimpleResult> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'ADMIN']);
  const ruleId = String(formData.get('ruleId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!ruleId || !(RULE_STATUSES as readonly string[]).includes(status)) return { error: 'invalidInput' };

  const before = await prisma.screeningRule.findUnique({ where: { id: ruleId } });
  await prisma.screeningRule.update({ where: { id: ruleId }, data: { status } });
  await logAudit({
    action: 'RULE_STATUS_CHANGED',
    actorId: session.userId,
    details: { ruleId, from: before?.status, to: status },
  });
  revalidatePath('/screening-rules');
  return { ok: true };
}

// ---------- alerts ----------

export async function updateAlertStatus(formData: FormData): Promise<SimpleResult> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const alertId = String(formData.get('alertId') ?? '');
  const status = String(formData.get('status') ?? '');
  const notes = String(formData.get('notes') ?? '');
  if (!alertId || !(ALERT_STATUSES as readonly string[]).includes(status)) return { error: 'invalidInput' };

  const before = await prisma.alert.findUnique({ where: { id: alertId } });
  const isTerminal = status === 'RESOLVED' || status === 'DISMISSED';
  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status,
      notes: notes || undefined,
      ...(isTerminal ? { resolvedById: session.userId, resolvedAt: new Date() } : {}),
    },
  });
  await logAudit({
    action: 'ALERT_STATUS_CHANGED',
    actorId: session.userId,
    details: { alertId, from: before?.status, to: status },
  });
  revalidatePath('/alerts');
  return { ok: true };
}
