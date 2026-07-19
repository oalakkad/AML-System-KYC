'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { rateLimit, clearRateLimit } from '@/lib/rate-limit';
import { createSessionToken, SESSION_COOKIE, SESSION_HOURS, SECURE_COOKIES } from './session';
import type { Role } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export interface LoginState {
  error?: 'invalidCredentials' | 'accountDisabled' | 'rateLimited';
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'invalidCredentials' };
  const { email, password } = parsed.data;

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limitKey = `login:${ip}:${email}`;
  const limit = rateLimit(limitKey, { max: 5, windowMs: 5 * 60 * 1000 });
  if (!limit.allowed) return { error: 'rateLimited' };

  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-shape comparison even when the user doesn't exist.
  const passwordOk = user
    ? bcrypt.compareSync(password, user.passwordHash)
    : (bcrypt.compareSync(password, '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZDzcyC5.z1Z1lM8nWn8mDR9V0nOhOG'), false);

  if (!user || !passwordOk) {
    await logAudit({ action: 'LOGIN_FAILED', details: { email } });
    return { error: 'invalidCredentials' };
  }
  if (!user.active) {
    await logAudit({ action: 'LOGIN_FAILED', actorId: user.id, details: { reason: 'disabled' } });
    return { error: 'accountDisabled' };
  }

  clearRateLimit(limitKey);
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    nameEn: user.nameEn,
    nameAr: user.nameAr,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE_COOKIES,
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  });
  await logAudit({ action: 'LOGIN_SUCCESS', actorId: user.id });
  redirect('/');
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const { getSession } = await import('./session');
  const session = await getSession();
  store.delete(SESSION_COOKIE);
  if (session) await logAudit({ action: 'LOGOUT', actorId: session.userId });
  redirect('/login');
}
