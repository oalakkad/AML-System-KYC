import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants';

export const SESSION_COOKIE = 'aml_session';
export const SESSION_HOURS = 8;

// Cookies default to Secure (HTTPS-only) in production, since that's the
// right default once a domain+TLS is in place. But a browser silently drops
// a Secure cookie set over a plain-HTTP response — so a production
// deployment with no TLS yet (e.g. an IP-only demo box) must opt out
// explicitly via COOKIE_SECURE=false, or every session dies on the very next
// request. Shared by both the staff session cookie and the client-portal one.
export const SECURE_COOKIES = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false';

export interface SessionUser {
  userId: string;
  email: string;
  role: Role;
  nameEn: string;
  nameAr: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set (>= 32 chars)');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    nameEn: user.nameEn,
    nameAr: user.nameAr,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.role !== 'string') return null;
    return {
      userId: payload.sub,
      email: String(payload.email ?? ''),
      role: payload.role as Role,
      nameEn: String(payload.nameEn ?? ''),
      nameAr: String(payload.nameAr ?? ''),
    };
  } catch {
    return null;
  }
}

/** Read the session from cookies (server components / actions). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Enforce authentication (and optionally roles) inside pages/actions.
 * Middleware already guards routes; this is defense in depth.
 */
export async function requireSession(roles?: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (roles && !roles.includes(session.role)) redirect('/');
  return session;
}
