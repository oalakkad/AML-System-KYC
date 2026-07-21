'use client';

// Dashboard charts — recharts, banking-palette validated colors.

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import type { CaseStatus, RiskRating, AlertType } from '@/lib/constants';

const AXIS_STYLE = { fontSize: 11, fill: 'var(--color-faint)', fontWeight: 600 };
const GRID_STROKE = 'var(--color-hairline)';

const RISK_COLOR: Record<RiskRating, string> = {
  LOW: 'var(--tone-green)',
  MEDIUM: 'var(--tone-amber)',
  HIGH: 'var(--tone-red)',
};

const STATUS_COLOR: Record<CaseStatus, string> = {
  DRAFT: 'var(--tone-slate)',
  PENDING_COMPLIANCE: 'var(--tone-blue)',
  RETURNED: 'var(--tone-amber)',
  PENDING_MANAGER: 'var(--tone-violet)',
  APPROVED: 'var(--tone-green)',
  REJECTED: 'var(--tone-red)',
};

const ALERT_TYPE_COLOR: Record<AlertType, string> = {
  STRUCTURING: 'var(--tone-red)',
  LARGE_TRANSACTION: 'var(--tone-amber)',
  HIGH_RISK_JURISDICTION: 'var(--tone-violet)',
};

/** Only the last (current) point gets a marker — with a soft glow — the rest of the line stays clean. */
function LastPointDot({ cx, cy, index, dataLength }: { cx?: number; cy?: number; index?: number; dataLength: number }) {
  if (cx === undefined || cy === undefined || index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4.5} fill="var(--color-accent)" filter="url(#trendDotGlow)" />
      <circle cx={cx} cy={cy} r={4.5} fill="var(--color-accent)" stroke="var(--color-card)" strokeWidth={1.5} />
    </g>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string; payload?: Record<string, unknown> }[];
  label?: string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-hairline bg-card px-3.5 py-2.5 shadow-premium text-xs">
      <p className="font-bold text-ink mb-1.5">{labelFormatter ? labelFormatter(label ?? '') : label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 font-semibold text-muted tnum">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color ?? 'var(--color-primary)' }} />
          {p.name}: <span className="font-bold text-ink ms-auto">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function CaseTrendChart({
  data,
  title,
  totalLabel,
}: {
  data: { date: string; label: string; count: number }[];
  title: string;
  totalLabel: string;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const dataMax = Math.max(1, ...data.map((d) => d.count));
  const yMax = Math.max(4, Math.ceil(dataMax));
  const tickStep = Math.max(1, Math.ceil(yMax / 4));
  const yTicks: number[] = [];
  for (let v = 0; v <= yMax; v += tickStep) yTicks.push(v);
  if (yTicks[yTicks.length - 1] !== yMax) yTicks.push(yMax);

  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <div className="mb-1 flex items-baseline gap-2">
          <p className="text-2xl font-extrabold tracking-tight tnum text-ink">{total}</p>
          <p className="text-sm font-semibold text-muted">{totalLabel}</p>
        </div>
        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-accent)" />
                </linearGradient>
                <filter id="trendDotGlow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                axisLine={{ stroke: 'var(--color-hairline)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
                domain={[0, yMax]}
                ticks={yTicks}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-hairline-strong)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                name={totalLabel}
                stroke="url(#trendLineGradient)"
                strokeWidth={2.5}
                fill="url(#trendGradient)"
                dot={<LastPointDot dataLength={data.length} />}
                activeDot={{ r: 5.5, fill: 'var(--color-accent)', strokeWidth: 1.5, stroke: 'var(--color-card)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

/** A single labeled row: dot + name, a proportional track, and the raw value —
 * the direct-labeled list style used for small categorical breakdowns instead
 * of a full bar chart with axes (each row already carries its own label). */
function BarRow({ name, count, max, color }: { name: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_1fr_3rem] items-center gap-3">
      <span className="flex items-center gap-2 truncate text-xs font-semibold text-muted">
        <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
        <span className="truncate">{name}</span>
      </span>
      <span className="h-2.25 overflow-hidden rounded-full bg-subtle">
        <span
          className="block h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </span>
      <span className="text-end text-xs font-bold tnum text-ink">{count}</span>
    </div>
  );
}

export function RiskDistributionChart({
  data,
  title,
  labels,
}: {
  data: { rating: RiskRating; count: number }[];
  title: string;
  labels: Record<RiskRating, string>;
}) {
  const chartData = data.map((d) => ({ ...d, name: labels[d.rating] }));
  const max = Math.max(1, ...chartData.map((d) => d.count));
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="space-y-3.5">
        {chartData.map((d) => (
          <BarRow key={d.rating} name={d.name} count={d.count} max={max} color={RISK_COLOR[d.rating]} />
        ))}
      </CardBody>
    </Card>
  );
}

export function StatusBreakdownChart({
  data,
  title,
  labels,
}: {
  data: { status: CaseStatus; count: number }[];
  title: string;
  labels: Record<CaseStatus, string>;
}) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, name: labels[d.status] }))
    .sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...chartData.map((d) => d.count));

  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className={chartData.length === 0 ? undefined : 'space-y-3.5'}>
        {chartData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted font-medium">—</div>
        ) : (
          chartData.map((d) => (
            <BarRow key={d.status} name={d.name} count={d.count} max={max} color={STATUS_COLOR[d.status]} />
          ))
        )}
      </CardBody>
    </Card>
  );
}

export function AlertVolumeChart({
  data,
  title,
  labels,
  emptyLabel,
}: {
  data: { alertType: AlertType; count: number }[];
  title: string;
  labels: Record<AlertType, string>;
  emptyLabel: string;
}) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, name: labels[d.alertType] }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        {chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted font-medium">{emptyLabel}</div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={{ stroke: 'var(--color-hairline)' }} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-subtle)' }} />
                <Bar dataKey="count" name={title} radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {chartData.map((d) => (
                    <Cell key={d.alertType} fill={ALERT_TYPE_COLOR[d.alertType]} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

