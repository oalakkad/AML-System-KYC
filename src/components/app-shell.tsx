'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
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
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { logout } from '@/lib/auth/actions';
import { LanguageToggle } from '@/components/language-toggle';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/constants';
import type { Dict } from '@/lib/i18n/en';

interface ShellUser {
  nameEn: string;
  nameAr: string;
  role: Role;
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

  // Single combined "KYC" entry — Individual + Corporate cases are already
  // unified in one list/queue (see listCases()); the sidebar shouldn't split
  // them into separate links. Destination is the role's primary KYC view.
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
  children,
}: {
  user: ShellUser;
  /** Admin-uploaded logo (Settings > Branding) — falls back to the shield mark when null. */
  logoUrl?: string | null;
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

  // hrefs may carry a query string (e.g. /cases/new?type=CORPORATE) that a
  // plain pathname comparison can't see — split it out and match separately
  // so the two "New Case" links don't both light up on the same page.
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
          'flex h-16 items-center gap-3 border-b border-sidebar-border px-4',
          collapsed && !mobile && 'justify-center px-0',
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-[#7a4c0f] text-white shadow-sm">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-full rounded-lg object-cover" />
          ) : (
            <ShieldCheck className="size-6" aria-hidden />
          )}
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-white">{dict.common.appName}</p>
            <p className="truncate text-sm text-blue-200/80">{dict.common.kycModule}</p>
          </div>
        )}
        {mobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ms-auto rounded-md p-1.5 text-blue-200 hover:bg-white/10 hover:text-white"
            aria-label={dict.common.close}
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main">
        {groups.map((group) => (
          <div key={group.label}>
            {(!collapsed || mobile) && (
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-blue-300/70">
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
                        'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold transition-colors',
                        collapsed && !mobile && 'justify-center px-0',
                        active
                          ? 'bg-sidebar-active text-white'
                          : 'text-blue-100/80 hover:bg-sidebar-hover hover:text-white',
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-accent" aria-hidden />
                      )}
                      <item.icon className="size-5 shrink-0" aria-hidden />
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
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={toggleCollapse}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-200/80 transition-colors hover:bg-sidebar-hover hover:text-white',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 rtl:rotate-180" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-5 rtl:rotate-180" aria-hidden />
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
          'sticky top-0 hidden h-dvh shrink-0 flex-col bg-gradient-to-b from-sidebar-from to-sidebar-to shadow-raised transition-[width] duration-200 print:hidden lg:flex',
          collapsed ? 'w-[76px]' : 'w-72',
        )}
      >
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 start-0 flex w-72 flex-col bg-gradient-to-b from-sidebar-from to-sidebar-to shadow-pop animate-fade-in">
            <SidebarInner mobile />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-hairline bg-card/95 px-4 backdrop-blur print:hidden lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted hover:bg-subtle hover:text-ink lg:hidden"
            aria-label="Menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <div className="min-w-0">
            <p className="text-xs text-faint">{dict.common.kycModule}</p>
            <h1 className="truncate text-sm font-semibold text-ink">{currentLabel}</h1>
          </div>

          <div className="ms-auto flex items-center gap-2">
            <LanguageToggle />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-lg py-1 ps-1 pe-2 transition-colors hover:bg-subtle"
                aria-haspopup="menu"
                aria-expanded={userMenu}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {initials(displayName)}
                </span>
                <span className="hidden text-start sm:block">
                  <span className="block max-w-32 truncate text-sm font-medium text-ink">{displayName}</span>
                  <span className="block text-xs text-faint">{dict.roles[user.role]}</span>
                </span>
                <ChevronLeft className="hidden size-4 -rotate-90 text-faint sm:block" aria-hidden />
              </button>

              {userMenu && (
                <div className="absolute end-0 mt-2 w-56 overflow-hidden rounded-lg border border-hairline bg-white shadow-pop animate-fade-in">
                  <div className="border-b border-hairline px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                    <p className="text-xs text-faint">{dict.roles[user.role]}</p>
                  </div>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
