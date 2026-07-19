import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import { verifyClientSessionToken, CLIENT_SESSION_COOKIE } from '@/lib/auth/client-session';
import type { Role } from '@/lib/constants';

const PUBLIC_PATHS = ['/login'];
const PORTAL_PUBLIC_PATHS = ['/portal/login', '/portal/register'];

// First matching rule wins.
const ROLE_RULES: { pattern: RegExp; roles: Role[] }[] = [
  { pattern: /^\/cases\/new$/, roles: ['FRONT_OFFICE'] },
  { pattern: /^\/cases\/[^/]+\/edit/, roles: ['FRONT_OFFICE'] },
  { pattern: /^\/review/, roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
  { pattern: /^\/approvals/, roles: ['SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/settings/, roles: ['ADMIN'] },
  // /screening-rules must be matched before the broader /screening prefix
  // below (first-match-wins) — otherwise it would silently inherit
  // /screening's roles (including SENIOR_MANAGER) instead of its own.
  { pattern: /^\/screening-rules/, roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
  { pattern: /^\/screening/, roles: ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/sanctions-lists/, roles: ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/risk-assessment/, roles: ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/transactions/, roles: ['FRONT_OFFICE', 'COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/alerts/, roles: ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/investigations/, roles: ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/str-reports/, roles: ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
  { pattern: /^\/reports-analytics/, roles: ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The client portal is a separate trust boundary from staff routes — it
  // has its own cookie and public paths, and never touches the staff session.
  if (pathname === '/portal' || pathname.startsWith('/portal/')) {
    if (PORTAL_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.next();
    }
    const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    const session = token ? await verifyClientSessionToken(token) : null;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/portal/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const rule = ROLE_RULES.find((r) => r.pattern.test(pathname));
  if (rule && !rule.roles.includes(session.role)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
