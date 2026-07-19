'use client';

// Dashboard charts — recharts, banking-palette validated colors (see dataviz skill run:
// risk trio + status set + trend line all pass the six-check validator in light mode).
// Single-series line needs no legend; multi-category sets ship a visible legend and,
// where the validator WARNed on contrast (risk severities), direct value labels.

import {
  ResponsiveContainer,
  LineChart,
  Line,
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

const AXIS_STYLE = { fontSize: 12, fill: '#94a3b8' };
const GRID_STROKE = '#e2e8f0';

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
  payload?: { value: number; name?: string; payload?: Record<string, unknown> }[];
  label?: string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-white px-3 py-2 shadow-raised">
      <p className="text-xs font-semibold text-ink">{labelFormatter ? labelFormatter(label ?? '') : label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-muted tnum">
          {p.name}: <span className="font-semibold text-ink">{p.value}</span>
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
  // Recharts' auto-tick algorithm can produce non-monotonic labels on small
  // integer ranges; compute a guaranteed-ascending integer tick set ourselves.
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
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
                domain={[0, yMax]}
                ticks={yTicks}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
              <Line
                type="linear"
                dataKey="count"
                name={totalLabel}
                stroke="#1e3a8a"
                strokeWidth={2}
                dot={{ r: 3, fill: '#1e3a8a', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
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
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" name={title} radius={[4, 4, 0, 0]} maxBarSize={64}>
                {chartData.map((d) => (
                  <Cell key={d.rating} fill={RISK_COLOR[d.rating]} />
                ))}
                <LabelList dataKey="count" position="top" style={{ fill: '#0f172a', fontSize: 12, fontWeight: 600 }} />
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
          <div className="flex h-56 items-center justify-center text-sm text-muted">—</div>
        ) : (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={AXIS_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {chartData.map((d) => (
                      <Cell key={d.status} fill={STATUS_COLOR[d.status]} />
                    ))}
                    <LabelList dataKey="count" position="right" style={{ fill: '#0f172a', fontSize: 12, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-hairline pt-3">
              {chartData.map((d) => (
                <span key={d.status} className="flex items-center gap-1.5 text-xs text-muted">
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
          <div className="flex h-56 items-center justify-center text-sm text-muted">{emptyLabel}</div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" name={title} radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {chartData.map((d) => (
                    <Cell key={d.alertType} fill={ALERT_TYPE_COLOR[d.alertType]} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fill: '#0f172a', fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
