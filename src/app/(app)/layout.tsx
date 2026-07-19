import { requireSession } from '@/lib/auth/session';
import { getBrandSettings } from '@/lib/settings/queries';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const brand = await getBrandSettings();
  return (
    <AppShell user={{ nameEn: session.nameEn, nameAr: session.nameAr, role: session.role }} logoUrl={brand.logoUrl}>
      {children}
    </AppShell>
  );
}
