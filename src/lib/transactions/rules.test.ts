import { describe, it, expect } from 'vitest';
import {
  evaluateVelocityCountSum,
  evaluateLargeSingleTransaction,
  evaluateHighRiskCountry,
  type TxnLike,
} from './rules';

function txn(overrides: Partial<TxnLike> = {}): TxnLike {
  return {
    type: 'CASH_DEPOSIT',
    amountKd: 1000,
    counterpartyCountry: null,
    createdAt: new Date('2026-07-16T12:00:00Z'),
    ...overrides,
  };
}

describe('evaluateVelocityCountSum', () => {
  const params = { transactionType: 'CASH_DEPOSIT' as const, windowHours: 72, minCount: 5, minAmountKd: 8000, maxAmountKd: 9999 };

  it('flags a structuring pattern: 5+ cash deposits in 72h summing 8k-9999k', () => {
    const prior = Array.from({ length: 4 }, (_, i) =>
      txn({ amountKd: 1800, createdAt: new Date(Date.now() - (i + 1) * 3600 * 1000) }),
    );
    const result = evaluateVelocityCountSum(params, {
      transaction: txn({ amountKd: 1800, createdAt: new Date() }),
      priorTransactions: prior,
      fatfByCode: new Map(),
    });
    expect(result.matched).toBe(true);
    expect(result.matchedCount).toBe(5);
  });

  it('does not flag when the sum is below the minimum', () => {
    const prior = [txn({ amountKd: 500 }), txn({ amountKd: 500 })];
    const result = evaluateVelocityCountSum(params, {
      transaction: txn({ amountKd: 500 }),
      priorTransactions: prior,
      fatfByCode: new Map(),
    });
    expect(result.matched).toBe(false);
  });

  it('does not flag when the sum exceeds the maximum (not a structuring pattern)', () => {
    const prior = Array.from({ length: 4 }, () => txn({ amountKd: 5000 }));
    const result = evaluateVelocityCountSum(params, {
      transaction: txn({ amountKd: 5000 }),
      priorTransactions: prior,
      fatfByCode: new Map(),
    });
    expect(result.matched).toBe(false);
  });

  it('excludes transactions outside the time window', () => {
    const prior = [
      // 100h before the (fixed) reference transaction below, outside the 72h window.
      // Anchored to that same fixed date, not Date.now() — mixing a real-clock
      // offset with the fixture's fixed date made this test's window boundary
      // drift (and eventually fail) as real time moved past 2026-07-16.
      txn({ amountKd: 2000, createdAt: new Date(Date.parse('2026-07-16T12:00:00Z') - 100 * 3600 * 1000) }),
      txn({ amountKd: 2000 }),
      txn({ amountKd: 2000 }),
      txn({ amountKd: 2000 }),
    ];
    const result = evaluateVelocityCountSum(params, {
      transaction: txn({ amountKd: 2000 }),
      priorTransactions: prior,
      fatfByCode: new Map(),
    });
    // only 4 in-window (3 prior + the new one), needs 5
    expect(result.matchedCount).toBe(4);
    expect(result.matched).toBe(false);
  });

  it('ignores transactions of a different type', () => {
    const prior = [
      txn({ type: 'WIRE_IN', amountKd: 2000 }),
      txn({ amountKd: 2000 }),
      txn({ amountKd: 2000 }),
      txn({ amountKd: 2000 }),
    ];
    const result = evaluateVelocityCountSum(params, {
      transaction: txn({ amountKd: 2000 }),
      priorTransactions: prior,
      fatfByCode: new Map(),
    });
    expect(result.matchedCount).toBe(4); // the WIRE_IN one excluded
  });
});

describe('evaluateLargeSingleTransaction', () => {
  it('flags a transaction at or above the threshold', () => {
    const params = { transactionType: 'ANY' as const, thresholdAmountKd: 50000 };
    expect(evaluateLargeSingleTransaction(params, { transaction: txn({ amountKd: 50000 }), priorTransactions: [], fatfByCode: new Map() }).matched).toBe(true);
    expect(evaluateLargeSingleTransaction(params, { transaction: txn({ amountKd: 49999 }), priorTransactions: [], fatfByCode: new Map() }).matched).toBe(false);
  });

  it('respects a specific transaction type filter', () => {
    const params = { transactionType: 'WIRE_OUT' as const, thresholdAmountKd: 10000 };
    const result = evaluateLargeSingleTransaction(params, {
      transaction: txn({ type: 'CASH_DEPOSIT', amountKd: 20000 }),
      priorTransactions: [],
      fatfByCode: new Map(),
    });
    expect(result.matched).toBe(false);
  });
});

describe('evaluateHighRiskCountry', () => {
  const fatfByCode = new Map([
    ['IR', 'BLACK' as const],
    ['KW', 'GREY' as const],
    ['US', 'NONE' as const],
  ]);

  it('flags a black-listed counterparty country', () => {
    const result = evaluateHighRiskCountry(
      { includeGreylist: true, includeBlacklist: true },
      { transaction: txn({ counterpartyCountry: 'IR' }), priorTransactions: [], fatfByCode },
    );
    expect(result.matched).toBe(true);
  });

  it('does not flag grey-list when includeGreylist is false', () => {
    const result = evaluateHighRiskCountry(
      { includeGreylist: false, includeBlacklist: true },
      { transaction: txn({ counterpartyCountry: 'KW' }), priorTransactions: [], fatfByCode },
    );
    expect(result.matched).toBe(false);
  });

  it('does not flag a clean country or a missing counterparty', () => {
    expect(
      evaluateHighRiskCountry(
        { includeGreylist: true, includeBlacklist: true },
        { transaction: txn({ counterpartyCountry: 'US' }), priorTransactions: [], fatfByCode },
      ).matched,
    ).toBe(false);
    expect(
      evaluateHighRiskCountry(
        { includeGreylist: true, includeBlacklist: true },
        { transaction: txn({ counterpartyCountry: null }), priorTransactions: [], fatfByCode },
      ).matched,
    ).toBe(false);
  });
});
