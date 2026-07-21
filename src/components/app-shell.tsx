'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  BellRing,
  ChevronLeft,
  FileText,
  Files,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { logout } from '@/lib/auth/actions';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/constants';
import type { Dict } from '@/lib/i18n/en';

interface ShellUser {
  nameEn: string;
  nameAr: string;
  role: Role;
}

/** Cap the header bell badge so it never wraps to two lines. */
function badgeCount(n: number): string {
  return n > 9 ? '9+' : String(n);
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

function navGroups(role: Role, dict: Dict): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: dict.nav.dashboard,
      items: [{ href: '/', label: dict.nav.dashboard, icon: LayoutDashboard, exact: true }],
    },
  ];

  const kycHref =
    role === 'COMPLIANCE_OFFICER' ? '/review' : role === 'SENIOR_MANAGER' ? '/approvals' : '/cases';
  groups.push({
    label: dict.nav.kycGroup,
    items: [{ href: kycHref, label: dict.nav.kycGroup, icon: Files }],
  });

  if (role === 'COMPLIANCE_OFFICER' || role === 'SENIOR_MANAGER' || role === 'ADMIN') {
    groups.push({
      label: dict.nav.screeningGroup,
      items: [
        { href: '/screening', label: dict.nav.listScreening, icon: Search },
        { href: '/sanctions-lists', label: dict.nav.sanctionsLists, icon: ListChecks },
        { href: '/risk-assessment', label: dict.nav.riskAssessment, icon: Gauge },
      ],
    });
  }

  if (role === 'FRONT_OFFICE' || role === 'COMPLIANCE_OFFICER' || role === 'SENIOR_MANAGER' || role === 'ADMIN') {
    const txnItems: NavItem[] = [{ href: '/transactions', label: dict.nav.transactionMonitoring, icon: Activity }];
    if (role !== 'FRONT_OFFICE') {
      txnItems.push({ href: '/alerts', label: dict.nav.alerts, icon: BellRing });
      txnItems.push({ href: '/investigations', label: dict.nav.investigations, icon: FolderKanban });
    }
    groups.push({ label: dict.nav.transactionsGroup, items: txnItems });
  }

  if (role === 'COMPLIANCE_OFFICER' || role === 'SENIOR_MANAGER' || role === 'ADMIN') {
    groups.push({
      label: dict.nav.reportsGroup,
      items: [
        { href: '/str-reports', label: dict.nav.strReports, icon: FileText },
        { href: '/reports-analytics', label: dict.nav.reportsAnalytics, icon: BarChart3 },
      ],
    });
  }

  if (role === 'ADMIN' || role === 'COMPLIANCE_OFFICER') {
    const systemItems: NavItem[] = [];
    if (role === 'COMPLIANCE_OFFICER' || role === 'ADMIN') {
      systemItems.push({ href: '/screening-rules', label: dict.nav.screeningRules, icon: SlidersHorizontal });
    }
    if (role === 'ADMIN') {
      systemItems.push({ href: '/settings', label: dict.nav.settings, icon: Settings });
    }
    groups.push({ label: dict.nav.system, items: systemItems });
  }
  return groups;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function AppShell({
  user,
  logoUrl,
  alertCount,
  children,
}: {
  user: ShellUser;
  logoUrl?: string | null;
  alertCount?: number;
  children: React.ReactNode;
}) {
  const { dict, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type');
  const groups = navGroups(user.role, dict);
  const displayName = locale === 'ar' && user.nameAr ? user.nameAr : user.nameEn;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCollapsed(localStorage.getItem('aml_sidebar_collapsed') === '1');
  }, []);
  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem('aml_sidebar_collapsed', c ? '0' : '1');
      return !c;
    });
  };

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const parseHref = (href: string) => {
    const [path, query] = href.split('?');
    return { path, type: new URLSearchParams(query ?? '').get('type') };
  };
  const allItems = groups.flatMap((g) => g.items);
  const activeHref = allItems
    .filter((i) => {
      const { path, type } = parseHref(i.href);
      const pathMatches = i.exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
      if (!pathMatches) return false;
      return type ? currentType === type : !currentType;
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (item: NavItem) => item.href === activeHref;
  const currentLabel = allItems.find((i) => i.href === activeHref)?.label ?? dict.nav.dashboard;

  const SidebarInner = ({ mobile }: { mobile?: boolean }) => (
    <>
      {/* Brand */}
      <div
        className={cn(
          'flex h-16 items-center gap-3 border-b border-sidebar-border px-6',
          collapsed && !mobile && 'justify-center px-0',
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25 overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-full rounded-xl object-cover" />
          ) : (
            <span className="text-xs font-black tracking-tight">AM</span>
          )}
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-ink tracking-tight">{dict.common.appName}</p>
            <p className="truncate text-[11px] font-bold uppercase tracking-widest text-faint">{dict.common.kycModule}</p>
          </div>
        )}
        {mobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ms-auto rounded-lg p-1.5 text-faint hover:bg-subtle hover:text-ink transition-colors"
            aria-label={dict.common.close}
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-label="Main">
        {groups.map((group) => (
          <div key={group.label}>
            {(!collapsed || mobile) && (
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-faint">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed && !mobile ? item.label : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                        collapsed && !mobile && 'justify-center px-0',
                        active
                          ? 'bg-sidebar-active text-primary font-bold'
                          : 'text-muted hover:bg-sidebar-hover hover:text-ink',
                      )}
                    >
                      {active && (
                        <span
                          className="absolute inset-y-2.5 start-0 w-1 rounded-full bg-gradient-to-b from-primary to-accent shadow-[0_0_8px_var(--color-primary-soft)]"
                          aria-hidden
                        />
                      )}
                      <item.icon className="size-4 shrink-0 transition-transform group-hover:scale-105" aria-hidden />
                      {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!mobile && (
        <div className="border-t border-sidebar-border p-4">
          <button
            type="button"
            onClick={toggleCollapse}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-faint transition-colors hover:bg-sidebar-hover hover:text-muted',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4.5 rtl:rotate-180" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-4.5 rtl:rotate-180" aria-hidden />
                <span>{dict.common.collapse}</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-gradient-to-b from-sidebar-from to-sidebar-to transition-[width] duration-200 print:hidden lg:flex',
          collapsed ? 'w-[72px]' : 'w-68',
        )}
      >
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 start-0 flex w-68 flex-col border-e border-sidebar-border bg-gradient-to-b from-sidebar-from to-sidebar-to shadow-pop animate-fade-in">
            <SidebarInner mobile />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-hairline bg-card px-6 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted hover:bg-subtle hover:text-ink lg:hidden transition-colors"
              aria-label="Menu"
            >
              <Menu className="size-5" aria-hidden />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted/80">{dict.common.kycModule}</p>
              <h1 className="truncate text-base font-bold text-ink leading-tight">{currentLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />

            {alertCount !== undefined && (
              <Link
                href="/alerts"
                className="relative flex size-8.5 items-center justify-center rounded-xl text-muted transition-colors hover:bg-subtle hover:text-ink"
                aria-label={dict.nav.alerts}
              >
                <Bell className="size-4.5" aria-hidden />
                {alertCount > 0 && (
                  <span className="absolute top-1 end-1 flex size-3.5 items-center justify-center rounded-full border-2 border-card bg-[var(--color-bad)] text-[8px] font-bold text-white">
                    {badgeCount(alertCount)}
                  </span>
                )}
              </Link>
            )}

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-xl py-1 ps-1 pe-2 transition-all hover:bg-subtle"
                aria-haspopup="menu"
                aria-expanded={userMenu}
              >
                <span className="flex size-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white shadow-sm shadow-primary/20">
                  {initials(displayName)}
                </span>
                <span className="hidden text-start sm:block">
                  <span className="block max-w-32 truncate text-sm font-bold text-ink leading-tight">{displayName}</span>
                  <span className="block text-[11px] font-semibold text-muted leading-none mt-0.5">{dict.roles[user.role]}</span>
                </span>
                <ChevronLeft className="hidden size-4 -rotate-90 text-faint sm:block transition-transform duration-200" aria-hidden />
              </button>

              {userMenu && (
                <div className="absolute end-0 mt-2 w-56 overflow-hidden rounded-xl border border-hairline bg-card shadow-pop animate-scale-in">
                  <div className="border-b border-hairline px-4 py-3">
                    <p className="truncate text-sm font-bold text-ink">{displayName}</p>
                    <p className="text-xs text-muted font-medium mt-0.5">{dict.roles[user.role]}</p>
                  </div>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--color-bad)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-bad)_10%,transparent)]"
                    >
                      <LogOut className="size-4" aria-hidden />
                      {dict.common.logout}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-7xl animate-fade-in-up">{children}</div>
        </main>
      </div>
    </div>
  );
}

