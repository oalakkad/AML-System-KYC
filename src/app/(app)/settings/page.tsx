import Link from 'next/link';
import { requireSession, SESSION_HOURS } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getUsers, getRoleCounts, getAuditLogs, getFatfCountries, getSystemSettings, getBrandSettings } from '@/lib/settings/queries';
import { UsersPanel } from './users-panel';
import { AuditLogPanel } from './audit-log-panel';
import { SecurityPanel } from './security-panel';
import { ListsPanel } from './lists-panel';
import { BrandingPanel } from './branding-panel';
import { ComingSoonPanel } from './coming-soon-panel';
import { cn } from '@/lib/utils';
import { BRAND_DEFAULTS, type AuditAction } from '@/lib/constants';

const TABS = ['users', 'audit', 'security', 'lists', 'branding', 'sso', 'api', 'notifications', 'forms'] as const;
type Tab = (typeof TABS)[number];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireSession(['ADMIN']);
  const { dict } = await getDict();
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? '') ? (sp.tab as Tab) : 'users';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">{dict.settings.title}</h1>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav className="space-y-1" aria-label="Settings">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/settings?tab=${t}`}
              className={cn(
                'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-subtle hover:text-ink',
              )}
            >
              {dict.settings.tabs[t]}
            </Link>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === 'users' && (
            <UsersPanel users={await getUsers()} roleCounts={await getRoleCounts()} currentUserId={session.userId} />
          )}
          {tab === 'audit' && (
            <AuditLogPanel
              filters={{
                action: sp.action as AuditAction | undefined,
                from: sp.from,
                to: sp.to,
                page: Number(sp.page ?? '1') || 1,
              }}
              result={await getAuditLogs({
                action: sp.action as AuditAction | undefined,
                from: sp.from,
                to: sp.to,
                page: Number(sp.page ?? '1') || 1,
              })}
            />
          )}
          {tab === 'security' && <SecurityPanel sessionHours={SESSION_HOURS} />}
          {tab === 'lists' && (
            <ListsPanel countries={await getFatfCountries()} settings={await getSystemSettings()} />
          )}
          {tab === 'branding' && <BrandingPanel brand={await getBrandSettings()} defaults={BRAND_DEFAULTS} />}
          {tab === 'sso' && <ComingSoonPanel title={dict.settings.tabs.sso} />}
          {tab === 'api' && <ComingSoonPanel title={dict.settings.tabs.api} />}
          {tab === 'notifications' && <ComingSoonPanel title={dict.settings.tabs.notifications} />}
          {tab === 'forms' && <ComingSoonPanel title={dict.settings.tabs.forms} />}
        </div>
      </div>
    </div>
  );
}
