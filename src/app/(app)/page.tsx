import Link from 'next/link';
import {
  FilePlus2,
  Files,
  ClipboardList,
  Stamp,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Building2,
  Sparkles,
} from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { prisma } from '@/lib/db';
import { frontOfficeScopedWhere } from '@/lib/cases/queries';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard, type StatBreakdownRow } from '@/components/stat-card';
import { StatusBadge, RiskBadge } from '@/components/status-badge';
import { AvatarChip } from '@/components/ui/avatar-chip';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { CaseTrendChart, RiskDistributionChart, StatusBreakdownChart } from '@/components/charts/dashboard-charts';
import { AuditTimeline } from '@/components/kyc/audit-timeline';
import { getRecentActivity } from '@/lib/audit';
import { getCraReviewCompliance } from '@/lib/risk/cra-queries';
import { interpolate } from '@/lib/i18n/interpolate';
import { formatDate } from '@/lib/utils';
import { CASE_STATUSES, RISK_RATINGS, type CaseStatus, type RiskRating, type Role } from '@/lib/constants';
import type { Dict } from '@/lib/i18n/en';

const TREND_DAYS = 14;
const RISK_TONE: Record<RiskRating, 'green' | 'amber' | 'red'> = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red' };

/** Risk-rating decomposition of a case count — the hover detail behind every KPI card. */
async function riskBreakdown(where: Prisma.KycCaseWhereInput, dict: Dict): Promise<StatBreakdownRow[]> {
  const rows = await prisma.kycCase.findMany({ where, select: { finalRiskRating: true, systemRiskRating: true } });
  const counts: Record<RiskRating, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const r of rows) {
    const rating = (r.finalRiskRating ?? r.systemRiskRating) as RiskRating | null;
    if (rating) counts[rating] += 1;
  }
  return RISK_RATINGS.filter((r) => counts[r] > 0).map((r) => ({
    label: dict.risk[r],
    value: counts[r],
    tone: RISK_TONE[r],
  }));
}

async function statsFor(role: Role, userId: string, dict: Dict) {
  const mineFilter = frontOfficeScopedWhere(role, userId);
  const filters = {
    total: mineFilter,
    drafts: { ...mineFilter, status: 'DRAFT' },
    pendingCompliance: { status: 'PENDING_COMPLIANCE' },
    pendingManager: { status: 'PENDING_MANAGER' },
    approved: { ...mineFilter, status: 'APPROVED' },
    rejected: { ...mineFilter, status: 'REJECTED' },
    returned: { ...mineFilter, status: 'RETURNED' },
    highRisk: { finalRiskRating: 'HIGH', status: { in: ['PENDING_COMPLIANCE', 'PENDING_MANAGER'] } },
  } satisfies Record<string, Prisma.KycCaseWhereInput>;

  const keys = Object.keys(filters) as (keyof typeof filters)[];
  const [counts, breakdowns] = await Promise.all([
    Promise.all(keys.map((k) => prisma.kycCase.count({ where: filters[k] }))),
    Promise.all(keys.map((k) => riskBreakdown(filters[k], dict))),
  ]);

  const result = {} as Record<keyof typeof filters, number> & { breakdown: Record<keyof typeof filters, StatBreakdownRow[]> };
  result.breakdown = {} as Record<keyof typeof filters, StatBreakdownRow[]>;
  keys.forEach((k, i) => {
    result[k] = counts[i];
    result.breakdown[k] = breakdowns[i];
  });
  return result;
}

async function corporateStatsFor(role: Role, userId: string, dict: Dict) {
  const mineFilter = frontOfficeScopedWhere(role, userId);
  const corp = { clientType: 'CORPORATE' as const };
  const filters = {
    total: { ...mineFilter, ...corp },
    pendingCompliance: { ...corp, status: 'PENDING_COMPLIANCE' },
    approved: { ...mineFilter, ...corp, status: 'APPROVED' },
    highRisk: { ...corp, finalRiskRating: 'HIGH', status: { in: ['PENDING_COMPLIANCE', 'PENDING_MANAGER'] } },
  } satisfies Record<string, Prisma.KycCaseWhereInput>;

  const keys = Object.keys(filters) as (keyof typeof filters)[];
  const [counts, breakdowns] = await Promise.all([
    Promise.all(keys.map((k) => prisma.kycCase.count({ where: filters[k] }))),
    Promise.all(keys.map((k) => riskBreakdown(filters[k], dict))),
  ]);

  const result = {} as Record<keyof typeof filters, number> & { breakdown: Record<keyof typeof filters, StatBreakdownRow[]> };
  result.breakdown = {} as Record<keyof typeof filters, StatBreakdownRow[]>;
  keys.forEach((k, i) => {
    result[k] = counts[i];
    result.breakdown[k] = breakdowns[i];
  });
  return result;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const { dict, locale } = await getDict();
  const stats = await statsFor(session.role, session.userId, dict);
  const corpStats = await corporateStatsFor(session.role, session.userId, dict);
  const displayName = locale === 'ar' && session.nameAr ? session.nameAr : session.nameEn;

  const scopedWhere = frontOfficeScopedWhere(session.role, session.userId);

  const recent = await prisma.kycCase.findMany({
    where: scopedWhere,
    orderBy: { updatedAt: 'desc' },
    take: 8,
    include: {
      profile: { select: { fullName: true } },
      corporateProfile: { select: { legalName: true } },
    },
  });

  // --- Chart data ---
  const trendStart = new Date();
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  const trendCases = await prisma.kycCase.findMany({
    where: { ...scopedWhere, createdAt: { gte: trendStart } },
    select: { createdAt: true },
  });
  const trendMap = new Map<string, number>();
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const c of trendCases) {
    const key = c.createdAt.toISOString().slice(0, 10);
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }
  const trendData = [...trendMap.entries()].map(([date, count]) => ({
    date,
    label: new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-GB', { month: 'short', day: 'numeric' }).format(
      new Date(date),
    ),
    count,
  }));
  const trendCounts = trendData.map((d) => d.count);

  const riskCases = await prisma.kycCase.findMany({
    where: scopedWhere,
    select: { finalRiskRating: true, systemRiskRating: true },
  });
  const riskCounts: Record<RiskRating, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const c of riskCases) {
    const rating = (c.finalRiskRating ?? c.systemRiskRating) as RiskRating | null;
    if (rating) riskCounts[rating] += 1;
  }
  const riskData = RISK_RATINGS.map((rating) => ({ rating, count: riskCounts[rating] }));

  const statusGroups = await prisma.kycCase.groupBy({
    by: ['status'],
    where: scopedWhere,
    _count: { status: true },
  });
  const statusCounts = new Map(statusGroups.map((g) => [g.status, g._count.status]));
  const statusData = CASE_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 }));

  // Risk-assessment access mirrors src/app/(app)/risk-assessment/page.tsx's own gate —
  // front office doesn't review CRA bands, so skip these two widgets for them.
  const seesRiskOps = session.role === 'COMPLIANCE_OFFICER' || session.role === 'SENIOR_MANAGER' || session.role === 'ADMIN';
  const [craCompliance, recentActivity] = seesRiskOps
    ? await Promise.all([getCraReviewCompliance(), getRecentActivity(locale)])
    : [null, []];

  const cards = (() => {
    const c: {
      label: string; value: number; icon: typeof Layers;
      tone: 'slate' | 'blue' | 'amber' | 'red' | 'green' | 'violet'; breakdown: StatBreakdownRow[];
      spark?: number[];
    }[] = [
      { label: dict.dashboard.totalCases, value: stats.total, icon: Layers, tone: 'slate', breakdown: stats.breakdown.total, spark: trendCounts },
    ];
    if (session.role === 'FRONT_OFFICE') {
      c.push(
        { label: dict.dashboard.drafts, value: stats.drafts, icon: Clock, tone: 'blue', breakdown: stats.breakdown.drafts },
        { label: dict.dashboard.returned, value: stats.returned, icon: RotateCcw, tone: 'amber', breakdown: stats.breakdown.returned },
        { label: dict.dashboard.approved, value: stats.approved, icon: CheckCircle2, tone: 'green', breakdown: stats.breakdown.approved },
      );
    } else if (session.role === 'COMPLIANCE_OFFICER') {
      c.push(
        { label: dict.dashboard.pendingCompliance, value: stats.pendingCompliance, icon: ClipboardList, tone: 'blue', breakdown: stats.breakdown.pendingCompliance },
        { label: dict.dashboard.highRisk, value: stats.highRisk, icon: AlertTriangle, tone: 'red', breakdown: stats.breakdown.highRisk },
        { label: dict.dashboard.approved, value: stats.approved, icon: CheckCircle2, tone: 'green', breakdown: stats.breakdown.approved },
      );
    } else {
      c.push(
        { label: dict.dashboard.pendingManager, value: stats.pendingManager, icon: ShieldAlert, tone: 'violet', breakdown: stats.breakdown.pendingManager },
        { label: dict.dashboard.highRisk, value: stats.highRisk, icon: AlertTriangle, tone: 'red', breakdown: stats.breakdown.highRisk },
        { label: dict.dashboard.approved, value: stats.approved, icon: CheckCircle2, tone: 'green', breakdown: stats.breakdown.approved },
      );
    }
    return c;
  })();

  const quickLinks = (() => {
    const links: { href: string; label: string; icon: typeof Files; primary?: boolean }[] = [];
    // Any staff role can open/create a new KYC (individual or corporate) —
    // only who reviews/approves stays role-restricted.
    links.push(
      { href: '/cases/new', label: dict.nav.newCase, icon: FilePlus2, primary: session.role === 'FRONT_OFFICE' },
      { href: '/cases/new?type=CORPORATE', label: dict.nav.newCorporateCase, icon: Building2 },
    );
    if (session.role === 'FRONT_OFFICE') {
      links.push({ href: '/cases', label: dict.nav.myCases, icon: Files });
    }
    if (session.role === 'COMPLIANCE_OFFICER' || session.role === 'ADMIN') {
      links.push({ href: '/review', label: dict.nav.reviewQueue, icon: ClipboardList, primary: session.role === 'COMPLIANCE_OFFICER' });
    }
    if (session.role === 'SENIOR_MANAGER' || session.role === 'ADMIN') {
      links.push({ href: '/approvals', label: dict.nav.approvalQueue, icon: Stamp, primary: session.role === 'SENIOR_MANAGER' });
    }
    return links;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{dict.dashboard.welcome}</p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink">{displayName}</h1>
          <p className="mt-1 text-sm text-muted">{dict.roles[session.role]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              <Button variant={l.primary ? 'primary' : 'secondary'}>
                <l.icon className="size-4" aria-hidden />
                {l.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {seesRiskOps && craCompliance && craCompliance.overdue > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-soft to-accent-soft p-3.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink">
            {interpolate(dict.dashboard.craOverdueCaption, { count: craCompliance.overdue })}
          </p>
          <Link href="/risk-assessment" className="ms-auto shrink-0 text-sm font-bold text-primary hover:underline">
            {dict.dashboard.craReviewCompliance} →
          </Link>
        </div>
      )}

      <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          className="pointer-events-none absolute -right-16 -top-10 -z-10 hidden size-72 rounded-full bg-accent/[0.06] blur-3xl lg:block"
          aria-hidden
        />
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            tone={c.tone}
            breakdown={c.breakdown}
            breakdownTitle={dict.risk.rating}
            spark={c.spark}
          />
        ))}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <Building2 className="size-4" aria-hidden />
          {dict.dashboard.corporateOverview}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={dict.dashboard.corporateCases} value={corpStats.total} icon={Building2} tone="slate" breakdown={corpStats.breakdown.total} breakdownTitle={dict.risk.rating} />
          <StatCard label={dict.dashboard.corporatePendingCompliance} value={corpStats.pendingCompliance} icon={ClipboardList} tone="blue" breakdown={corpStats.breakdown.pendingCompliance} breakdownTitle={dict.risk.rating} />
          <StatCard label={dict.dashboard.corporateHighRisk} value={corpStats.highRisk} icon={AlertTriangle} tone="red" breakdown={corpStats.breakdown.highRisk} breakdownTitle={dict.risk.rating} />
          <StatCard label={dict.dashboard.corporateApproved} value={corpStats.approved} icon={CheckCircle2} tone="green" breakdown={corpStats.breakdown.approved} breakdownTitle={dict.risk.rating} />
        </div>
      </div>

      <CaseTrendChart data={trendData} title={dict.dashboard.caseVolumeTrend} totalLabel={dict.dashboard.casesSubmitted} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RiskDistributionChart data={riskData} title={dict.dashboard.riskDistribution} labels={dict.risk} />
        <StatusBreakdownChart data={statusData} title={dict.dashboard.statusBreakdown} labels={dict.status} />
      </div>

      {seesRiskOps && craCompliance && (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          <Card>
            <CardHeader title={dict.dashboard.craReviewCompliance} description={dict.dashboard.craReviewComplianceHint} />
            <CardBody className="flex flex-col items-center">
              <div className="relative size-32">
                <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="var(--color-bg)" strokeWidth="11" />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    fill="none"
                    stroke={craCompliance.percentOnTime >= 80 ? '#0f9d6d' : craCompliance.percentOnTime >= 50 ? '#c77d0a' : '#dc3545'}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - craCompliance.percentOnTime / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-black tnum text-ink">{craCompliance.percentOnTime}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-faint">{dict.dashboard.onTime}</p>
                </div>
              </div>
              {craCompliance.total === 0 && (
                <p className="mt-3.5 text-center text-xs font-semibold text-muted">{dict.dashboard.craNoneAssessed}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.dashboard.recentActivity} description={dict.dashboard.recentActivityHint} />
            <CardBody>
              {recentActivity.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">{dict.dashboard.noRecentActivity}</p>
              ) : (
                <AuditTimeline entries={recentActivity} />
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader
          title={dict.dashboard.recentCases}
          actions={
            <Link
              href="/cases"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {dict.common.view}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          }
        />
        <CardBody className="p-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <Files className="size-8 text-faint" aria-hidden />
              <p className="text-sm text-muted">{dict.caseView.noCases}</p>
              {session.role === 'FRONT_OFFICE' && (
                <Link href="/cases/new" className="mt-2">
                  <Button size="sm">
                    <FilePlus2 className="size-4" aria-hidden />
                    {dict.nav.newCase}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>{dict.caseView.caseNumber}</Th>
                  <Th>{dict.caseView.client}</Th>
                  <Th>{dict.risk.rating}</Th>
                  <Th>{dict.caseView.status}</Th>
                  <Th>{dict.caseView.updatedAt}</Th>
                </Tr>
              </THead>
              <TBody>
                {recent.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link href={`/cases/${c.id}`} className="font-semibold text-primary hover:underline">
                        {c.caseNumber}
                      </Link>
                    </Td>
                    <Td>
                      {(() => {
                        const clientName = c.profile?.fullName || c.corporateProfile?.legalName;
                        return clientName ? (
                          <span className="flex items-center gap-2.5">
                            <AvatarChip name={clientName} />
                            {clientName}
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        );
                      })()}
                    </Td>
                    <Td>
                      <RiskBadge rating={c.finalRiskRating as RiskRating | null} />
                    </Td>
                    <Td>
                      <StatusBadge status={c.status as CaseStatus} />
                    </Td>
                    <Td className="text-muted">{formatDate(c.updatedAt, locale)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
