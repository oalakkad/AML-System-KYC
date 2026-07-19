import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getReportsOverview, getKycStatusBreakdown, getAlertVolumeByCategory } from '@/lib/reports/queries';
import { Card, CardBody } from '@/components/ui/card';
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
          <h1 className="text-2xl font-bold text-ink">{dict.reports.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.reports.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelect days={days} />
          <ExportPdfButton />
        </div>
      </div>

      <p className="text-xs text-faint">{interpolate(dict.reports.lastNDays, { days })}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-2xl font-bold tnum text-ink">{overview.totalTransactions}</p>
            <p className="text-xs text-muted">{dict.reports.totalTransactions}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-2xl font-bold tnum text-ink">
              {overview.transactionValueKd.toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-KW')}
            </p>
            <p className="text-xs text-muted">{dict.reports.transactionValue}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-2xl font-bold tnum text-emerald-600">{overview.strsSubmitted}</p>
            <p className="text-xs text-muted">{dict.reports.strsSubmitted}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-2xl font-bold tnum text-amber-600">{overview.alertsCount}</p>
            <p className="text-xs text-muted">{dict.reports.alerts}</p>
          </CardBody>
        </Card>
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
