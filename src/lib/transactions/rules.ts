// Transaction screening rule engine — pure and unit-tested, mirrors the style
// of src/lib/risk/engine.ts and src/lib/screening/similarity.ts.
//
// Rules are STRUCTURED data (a ruleType + typed params), not a free-text
// DSL that gets parsed/eval'd. A parameterized builder was chosen
// deliberately over interpreting arbitrary rule text: evaluating
// user-authored "code" (even a small custom language) is a real injection
// surface if the parser has any gap, and the structured form covers the
// same three concrete patterns the reference platform's example rule
// showed (velocity+sum, large single transaction, high-risk jurisdiction)
// without that risk.

import type { FatfStatus, TransactionType } from '@/lib/constants';

export interface VelocityCountSumParams {
  transactionType: TransactionType | 'ANY';
  windowHours: number;
  minCount: number;
  minAmountKd: number;
  maxAmountKd: number;
}

export interface LargeSingleTransactionParams {
  transactionType: TransactionType | 'ANY';
  thresholdAmountKd: number;
}

export interface HighRiskCountryParams {
  includeGreylist: boolean;
  includeBlacklist: boolean;
}

export type RuleParams = VelocityCountSumParams | LargeSingleTransactionParams | HighRiskCountryParams;

export interface TxnLike {
  type: string;
  amountKd: number;
  counterpartyCountry: string | null;
  createdAt: Date;
}

export interface EvaluationContext {
  transaction: TxnLike;
  /** other transactions on the same case, most recent first — excludes `transaction` itself */
  priorTransactions: TxnLike[];
  fatfByCode: Map<string, FatfStatus>;
}

export interface RuleEvalResult {
  matched: boolean;
  /** transactions that contributed to the match (for velocity rules) */
  matchedCount?: number;
  matchedSumKd?: number;
}

export function evaluateVelocityCountSum(params: VelocityCountSumParams, ctx: EvaluationContext): RuleEvalResult {
  const windowStart = ctx.transaction.createdAt.getTime() - params.windowHours * 60 * 60 * 1000;
  const inWindow = [ctx.transaction, ...ctx.priorTransactions].filter(
    (t) =>
      t.createdAt.getTime() >= windowStart &&
      t.createdAt.getTime() <= ctx.transaction.createdAt.getTime() &&
      (params.transactionType === 'ANY' || t.type === params.transactionType),
  );
  const sum = inWindow.reduce((s, t) => s + t.amountKd, 0);
  const matched = inWindow.length >= params.minCount && sum >= params.minAmountKd && sum <= params.maxAmountKd;
  return { matched, matchedCount: inWindow.length, matchedSumKd: sum };
}

export function evaluateLargeSingleTransaction(
  params: LargeSingleTransactionParams,
  ctx: EvaluationContext,
): RuleEvalResult {
  const typeMatches = params.transactionType === 'ANY' || ctx.transaction.type === params.transactionType;
  return { matched: typeMatches && ctx.transaction.amountKd >= params.thresholdAmountKd };
}

export function evaluateHighRiskCountry(params: HighRiskCountryParams, ctx: EvaluationContext): RuleEvalResult {
  if (!ctx.transaction.counterpartyCountry) return { matched: false };
  const status = ctx.fatfByCode.get(ctx.transaction.counterpartyCountry) ?? 'NONE';
  const matched = (status === 'GREY' && params.includeGreylist) || (status === 'BLACK' && params.includeBlacklist);
  return { matched };
}

export function evaluateRule(
  ruleType: 'VELOCITY_COUNT_SUM' | 'LARGE_SINGLE_TRANSACTION' | 'HIGH_RISK_COUNTRY',
  params: RuleParams,
  ctx: EvaluationContext,
): RuleEvalResult {
  switch (ruleType) {
    case 'VELOCITY_COUNT_SUM':
      return evaluateVelocityCountSum(params as VelocityCountSumParams, ctx);
    case 'LARGE_SINGLE_TRANSACTION':
      return evaluateLargeSingleTransaction(params as LargeSingleTransactionParams, ctx);
    case 'HIGH_RISK_COUNTRY':
      return evaluateHighRiskCountry(params as HighRiskCountryParams, ctx);
  }
}

/** Default alert type per rule type, used when a rule matches. */
export const DEFAULT_ALERT_TYPE = {
  VELOCITY_COUNT_SUM: 'STRUCTURING',
  LARGE_SINGLE_TRANSACTION: 'LARGE_TRANSACTION',
  HIGH_RISK_COUNTRY: 'HIGH_RISK_JURISDICTION',
} as const;
