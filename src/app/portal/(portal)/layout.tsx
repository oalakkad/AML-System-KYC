import { requireClientSession } from '@/lib/auth/client-session';
import { PortalShell } from '@/components/portal/portal-shell';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClientSession();
  return <PortalShell user={{ nameEn: session.nameEn, nameAr: session.nameAr }}>{children}</PortalShell>;
}
