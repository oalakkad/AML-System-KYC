import { describe, it, expect } from 'vitest';
import { transition, canEditCase, allowedActions, WorkflowError } from './workflow';

describe('canEditCase', () => {
  it('lets the maker edit DRAFT and RETURNED', () => {
    expect(canEditCase('DRAFT', 'FRONT_OFFICE', true)).toBe(true);
    expect(canEditCase('RETURNED', 'FRONT_OFFICE', true)).toBe(true);
  });
  it('blocks editing once submitted', () => {
    expect(canEditCase('PENDING_COMPLIANCE', 'FRONT_OFFICE', true)).toBe(false);
    expect(canEditCase('APPROVED', 'FRONT_OFFICE', true)).toBe(false);
  });
  it('blocks non-makers', () => {
    expect(canEditCase('DRAFT', 'FRONT_OFFICE', false)).toBe(false);
  });
  it('lets any staff role edit their own draft — creation is open to everyone', () => {
    expect(canEditCase('DRAFT', 'COMPLIANCE_OFFICER', true)).toBe(true);
    expect(canEditCase('DRAFT', 'SENIOR_MANAGER', true)).toBe(true);
    expect(canEditCase('DRAFT', 'ADMIN', true)).toBe(true);
  });
});

describe('transition — submit', () => {
  it('moves DRAFT to PENDING_COMPLIANCE', () => {
    expect(transition('DRAFT', 'SUBMIT', { role: 'FRONT_OFFICE', isMaker: true })).toBe('PENDING_COMPLIANCE');
  });
  it('moves RETURNED to PENDING_COMPLIANCE', () => {
    expect(transition('RETURNED', 'SUBMIT', { role: 'FRONT_OFFICE', isMaker: true })).toBe('PENDING_COMPLIANCE');
  });
  it('rejects submit by a non-maker', () => {
    expect(() => transition('DRAFT', 'SUBMIT', { role: 'FRONT_OFFICE', isMaker: false })).toThrow(WorkflowError);
  });
  it('allows submit by any staff role, as long as they are the maker', () => {
    expect(transition('DRAFT', 'SUBMIT', { role: 'COMPLIANCE_OFFICER', isMaker: true })).toBe('PENDING_COMPLIANCE');
    expect(transition('DRAFT', 'SUBMIT', { role: 'SENIOR_MANAGER', isMaker: true })).toBe('PENDING_COMPLIANCE');
    expect(transition('DRAFT', 'SUBMIT', { role: 'ADMIN', isMaker: true })).toBe('PENDING_COMPLIANCE');
  });
});

describe('transition — compliance', () => {
  it('finalizes a LOW-risk case on approve', () => {
    expect(
      transition('PENDING_COMPLIANCE', 'COMPLIANCE_APPROVE', {
        role: 'COMPLIANCE_OFFICER',
        isMaker: false,
        finalRiskRating: 'LOW',
      }),
    ).toBe('APPROVED');
  });
  it('escalates a HIGH-risk case on approve', () => {
    expect(
      transition('PENDING_COMPLIANCE', 'COMPLIANCE_APPROVE', {
        role: 'COMPLIANCE_OFFICER',
        isMaker: false,
        finalRiskRating: 'HIGH',
      }),
    ).toBe('PENDING_MANAGER');
  });
  it('returns and rejects', () => {
    const ctx = { role: 'COMPLIANCE_OFFICER' as const, isMaker: false };
    expect(transition('PENDING_COMPLIANCE', 'COMPLIANCE_RETURN', ctx)).toBe('RETURNED');
    expect(transition('PENDING_COMPLIANCE', 'COMPLIANCE_REJECT', ctx)).toBe('REJECTED');
  });
  it('rejects compliance action from senior manager', () => {
    expect(() =>
      transition('PENDING_COMPLIANCE', 'COMPLIANCE_APPROVE', { role: 'SENIOR_MANAGER', isMaker: false }),
    ).toThrow(WorkflowError);
  });
});

describe('transition — manager', () => {
  it('approves and rejects from PENDING_MANAGER', () => {
    const ctx = { role: 'SENIOR_MANAGER' as const, isMaker: false };
    expect(transition('PENDING_MANAGER', 'MANAGER_APPROVE', ctx)).toBe('APPROVED');
    expect(transition('PENDING_MANAGER', 'MANAGER_REJECT', ctx)).toBe('REJECTED');
  });
  it('cannot act on a case that is not pending manager', () => {
    expect(() =>
      transition('PENDING_COMPLIANCE', 'MANAGER_APPROVE', { role: 'SENIOR_MANAGER', isMaker: false }),
    ).toThrow(WorkflowError);
  });
});

describe('allowedActions', () => {
  it('offers compliance the three decisions on a pending case', () => {
    const actions = allowedActions('PENDING_COMPLIANCE', 'COMPLIANCE_OFFICER', false);
    expect(actions).toContain('COMPLIANCE_APPROVE');
    expect(actions).toContain('COMPLIANCE_REJECT');
    expect(actions).toContain('COMPLIANCE_RETURN');
    expect(actions).not.toContain('SUBMIT');
  });
  it('offers the maker submit on a draft', () => {
    expect(allowedActions('DRAFT', 'FRONT_OFFICE', true)).toEqual(['SUBMIT']);
  });
  it('offers nothing on an approved case', () => {
    expect(allowedActions('APPROVED', 'COMPLIANCE_OFFICER', false)).toEqual([]);
  });
});
