import { requireSession } from '@/lib/auth/session';
import { getBrandSettings } from '@/lib/settings/queries';
import { getAlertCounts } from '@/lib/transactions/queries';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const seesAlerts = session.role !== 'FRONT_OFFICE';
  const [brand, alertCounts] = await Promise.all([
    getBrandSettings(),
    seesAlerts ? getAlertCounts() : Promise.resolve(null),
  ]);
  return (
    <AppShell
      user={{ nameEn: session.nameEn, nameAr: session.nameAr, role: session.role }}
      logoUrl={brand.logoUrl}
      alertCount={alertCounts?.total}
    >
      {children}
    </AppShell>
  );
}
