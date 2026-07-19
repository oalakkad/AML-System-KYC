// Session module for the client self-service portal — mirrors session.ts but
// deliberately kept as a separate cookie/JWT/trust boundary from the staff
// `aml_session`. A ClientUser must never be able to authenticate as staff or
// vice versa.

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const CLIENT_SESSION_COOKIE = 'aml_client_session';
export const CLIENT_SESSION_HOURS = 8;

export interface ClientSessionUser {
  clientUserId: string;
  email: string;
  nameEn: string;
  nameAr: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set (>= 32 chars)');
  }
  // Distinct signing subject from the staff session so a leaked/forged staff
  // JWT payload shape can't be replayed here even if the secret is shared.
  return new TextEncoder().encode(`client:${secret}`);
}

export async function createClientSessionToken(user: ClientSessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    nameEn: user.nameEn,
    nameAr: user.nameAr,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.clientUserId)
    .setIssuedAt()
    .setExpirationTime(`${CLIENT_SESSION_HOURS}h`)
    .sign(getSecret());
}

export async function verifyClientSessionToken(token: string): Promise<ClientSessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      clientUserId: payload.sub,
      email: String(payload.email ?? ''),
      nameEn: String(payload.nameEn ?? ''),
      nameAr: String(payload.nameAr ?? ''),
    };
  } catch {
    return null;
  }
}

/** Read the client session from cookies (server components / actions). */
export async function getClientSession(): Promise<ClientSessionUser | null> {
  const store = await cookies();
  const token = store.get(CLIENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyClientSessionToken(token);
}

/**
 * Enforce client authentication inside portal pages/actions. Middleware
 * already guards /portal routes; this is defense in depth.
 */
export async function requireClientSession(): Promise<ClientSessionUser> {
  const session = await getClientSession();
  if (!session) redirect('/portal/login');
  return session;
}
