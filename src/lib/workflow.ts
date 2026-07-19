// KYC case workflow state machine — pure and unit-testable.
// Every transition is validated here before it is persisted; server actions
// must go through `transition()` and never set statuses directly.

import type { CaseStatus, RiskRating, Role } from '@/lib/constants';

export type WorkflowAction =
  | 'SUBMIT'
  | 'COMPLIANCE_APPROVE'
  | 'COMPLIANCE_REJECT'
  | 'COMPLIANCE_RETURN'
  | 'MANAGER_APPROVE'
  | 'MANAGER_REJECT';

export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_TRANSITION'
      | 'ROLE_NOT_ALLOWED'
      | 'NOT_CASE_MAKER',
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

const ACTION_ROLES: Record<WorkflowAction, Role> = {
  SUBMIT: 'FRONT_OFFICE',
  COMPLIANCE_APPROVE: 'COMPLIANCE_OFFICER',
  COMPLIANCE_REJECT: 'COMPLIANCE_OFFICER',
  COMPLIANCE_RETURN: 'COMPLIANCE_OFFICER',
  MANAGER_APPROVE: 'SENIOR_MANAGER',
  MANAGER_REJECT: 'SENIOR_MANAGER',
};

export interface TransitionContext {
  role: Role;
  /** whether the acting user is the maker of the case (required for SUBMIT) */
  isMaker: boolean;
  /** final risk rating — decides compliance-approve routing */
  finalRiskRating?: RiskRating | null;
}

/** Statuses in which the maker may still edit the form. */
export function canEditCase(status: CaseStatus, role: Role, isMaker: boolean): boolean {
  return role === 'FRONT_OFFICE' && isMaker && (status === 'DRAFT' || status === 'RETURNED');
}

/** Compute the next status for an action, or throw WorkflowError. */
export function transition(
  current: CaseStatus,
  action: WorkflowAction,
  ctx: TransitionContext,
): CaseStatus {
  if (ctx.role !== ACTION_ROLES[action]) {
    throw new WorkflowError(
      `Role ${ctx.role} is not allowed to perform ${action}`,
      'ROLE_NOT_ALLOWED',
    );
  }

  switch (action) {
    case 'SUBMIT': {
      if (!ctx.isMaker) {
        throw new WorkflowError('Only the case maker can submit', 'NOT_CASE_MAKER');
      }
      if (current !== 'DRAFT' && current !== 'RETURNED') {
        throw new WorkflowError(`Cannot submit from ${current}`, 'INVALID_TRANSITION');
      }
      return 'PENDING_COMPLIANCE';
    }
    case 'COMPLIANCE_APPROVE': {
      if (current !== 'PENDING_COMPLIANCE') {
        throw new WorkflowError(`Cannot approve from ${current}`, 'INVALID_TRANSITION');
      }
      // High-risk cases escalate to senior management instead of finalizing.
      return ctx.finalRiskRating === 'HIGH' ? 'PENDING_MANAGER' : 'APPROVED';
    }
    case 'COMPLIANCE_REJECT': {
      if (current !== 'PENDING_COMPLIANCE') {
        throw new WorkflowError(`Cannot reject from ${current}`, 'INVALID_TRANSITION');
      }
      return 'REJECTED';
    }
    case 'COMPLIANCE_RETURN': {
      if (current !== 'PENDING_COMPLIANCE') {
        throw new WorkflowError(`Cannot return from ${current}`, 'INVALID_TRANSITION');
      }
      return 'RETURNED';
    }
    case 'MANAGER_APPROVE': {
      if (current !== 'PENDING_MANAGER') {
        throw new WorkflowError(`Cannot approve from ${current}`, 'INVALID_TRANSITION');
      }
      return 'APPROVED';
    }
    case 'MANAGER_REJECT': {
      if (current !== 'PENDING_MANAGER') {
        throw new WorkflowError(`Cannot reject from ${current}`, 'INVALID_TRANSITION');
      }
      return 'REJECTED';
    }
  }
}

/** Actions a given role can take on a case in a given status (for the UI). */
export function allowedActions(
  status: CaseStatus,
  role: Role,
  isMaker: boolean,
): WorkflowAction[] {
  const all: WorkflowAction[] = [
    'SUBMIT',
    'COMPLIANCE_APPROVE',
    'COMPLIANCE_REJECT',
    'COMPLIANCE_RETURN',
    'MANAGER_APPROVE',
    'MANAGER_REJECT',
  ];
  return all.filter((action) => {
    try {
      transition(status, action, { role, isMaker, finalRiskRating: 'LOW' });
      return true;
    } catch {
      return false;
    }
  });
}
