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

const AXIS_STYLE = { fontSize: 11, fill: '#9497ac', fontWeight: 600 };
const GRID_STROKE = '#e6e7f2';

const RISK_COLOR: Record<RiskRating, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

const STATUS_COLOR: Record<CaseStatus, string> = {
  DRAFT: '#94a3b8',
  PENDING_COMPLIANCE: '#3b82f6',
  RETURNED: '#f59e0b',
  PENDING_MANAGER: '#8b5cf6',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

const ALERT_TYPE_COLOR: Record<AlertType, string> = {
  STRUCTURING: '#ef4444',
  LARGE_TRANSACTION: '#f59e0b',
  HIGH_RISK_JURISDICTION: '#8b5cf6',
};

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
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color ?? '#4f46e5' }} />
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
      <CardHeader
        title={title}
        description={`${total} ${totalLabel}`}
      />
      <CardBody>
        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                axisLine={{ stroke: '#e6e7f2' }}
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
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#d3d5e6', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                name={totalLabel}
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={{ r: 3.5, fill: 'var(--color-primary)', strokeWidth: 0 }}
                activeDot={{ r: 5.5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
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
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={{ stroke: '#e6e7f2' }} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f6f7fb' }} />
              <Bar dataKey="count" name={title} radius={[6, 6, 0, 0]} maxBarSize={52}>
                {chartData.map((d) => (
                  <Cell key={d.rating} fill={RISK_COLOR[d.rating]} />
                ))}
                <LabelList dataKey="count" position="top" style={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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

  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        {chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted font-medium">—</div>
        ) : (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  barCategoryGap="26%"
                >
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={AXIS_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f6f7fb' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={16}>
                    {chartData.map((d) => (
                      <Cell key={d.status} fill={STATUS_COLOR[d.status]} />
                    ))}
                    <LabelList dataKey="count" position="right" style={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-hairline pt-3">
              {chartData.map((d) => (
                <span key={d.status} className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[d.status] }} aria-hidden />
                  {d.name}
                </span>
              ))}
            </div>
          </>
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
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={{ stroke: '#e6e7f2' }} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f6f7fb' }} />
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

