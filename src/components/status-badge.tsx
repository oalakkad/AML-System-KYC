'use client';

import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/client';
import type { CaseStatus, RiskRating } from '@/lib/constants';
import { AlertTriangle, CheckCircle2, CircleDashed, Clock, RotateCcw, XCircle, ShieldAlert } from 'lucide-react';

const statusTone = {
  DRAFT: 'slate',
  PENDING_COMPLIANCE: 'blue',
  RETURNED: 'amber',
  PENDING_MANAGER: 'violet',
  APPROVED: 'green',
  REJECTED: 'red',
} as const;

const statusIcon = {
  DRAFT: CircleDashed,
  PENDING_COMPLIANCE: Clock,
  RETURNED: RotateCcw,
  PENDING_MANAGER: ShieldAlert,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
} as const;

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { dict } = useI18n();
  const Icon = statusIcon[status];
  return (
    <Badge tone={statusTone[status]}>
      <Icon className="size-3" aria-hidden />
      {dict.status[status]}
    </Badge>
  );
}

const riskTone = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red' } as const;

export function RiskBadge({ rating }: { rating: RiskRating | null | undefined }) {
  const { dict } = useI18n();
  if (!rating) return <span className="text-faint">—</span>;
  return (
    <Badge tone={riskTone[rating]}>
      {rating === 'HIGH' && <AlertTriangle className="size-3" aria-hidden />}
      {dict.risk[rating]}
    </Badge>
  );
}
