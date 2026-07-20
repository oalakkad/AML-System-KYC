import { Activity, Wallet, FileText, BellRing } from 'lucide-react';
import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getReportsOverview, getKycStatusBreakdown, getAlertVolumeByCategory } from '@/lib/reports/queries';
import { StatCard } from '@/components/stat-card';
import { StatusBreakdownChart, AlertVolumeChart } from '@/components/charts/dashboard-charts';
import { ExportPdfButton } from './export-pdf-button';
import { DateRangeSelect } from './date-range-select';
import { interpolate } from '@/lib/i18n/interpolate';

const VALID_RANGES = [7, 30, 90];

export default async function ReportsAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const { dict, locale } = await getDict();
  const { days: daysParam } = await searchParams;
  const days = VALID_RANGES.includes(Number(daysParam)) ? Number(daysParam) : 30;

  const [overview, kycStatus, alertVolume] = await Promise.all([
    getReportsOverview(days),
    getKycStatusBreakdown(),
    getAlertVolumeByCategory(days),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{dict.reports.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.reports.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelect days={days} />
          <ExportPdfButton />
        </div>
      </div>

      <p className="text-xs text-faint">{interpolate(dict.reports.lastNDays, { days })}</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={dict.reports.totalTransactions} value={overview.totalTransactions} icon={Activity} tone="slate" />
        <StatCard
          label={dict.reports.transactionValue}
          value={overview.transactionValueKd.toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-KW')}
          icon={Wallet}
          tone="slate"
        />
        <StatCard label={dict.reports.strsSubmitted} value={overview.strsSubmitted} icon={FileText} tone="green" />
        <StatCard label={dict.reports.alerts} value={overview.alertsCount} icon={BellRing} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <StatusBreakdownChart data={kycStatus} title={dict.reports.kycStatusTitle} labels={dict.status} />
        <AlertVolumeChart
          data={alertVolume}
          title={dict.reports.alertVolumeTitle}
          labels={dict.alertTypes}
          emptyLabel={dict.reports.noData}
        />
      </div>
    </div>
  );
}
