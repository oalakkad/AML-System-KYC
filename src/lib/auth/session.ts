import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants';

export const SESSION_COOKIE = 'aml_session';
export const SESSION_HOURS = 8;

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
