'use server';

// Settings module: user management (RBAC), password change, FATF country
// list maintenance, and system settings. All user-management actions are
// ADMIN-only (enforced both here and in middleware.ts).

import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import {
  ROLES,
  FATF_STATUSES,
  SETTING_KEYS,
  BRAND_DEFAULTS,
  MAX_LOGO_BYTES,
  ALLOWED_LOGO_MIME,
  type Role,
} from '@/lib/constants';

// ---------- user management ----------

const createUserSchema = z.object({
  nameEn: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  role: z.enum(ROLES),
});

export interface CreateUserState {
  error?: 'emailTaken' | 'invalidInput';
  ok?: boolean;
}

export async function createStaffUser(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const session = await requireSession(['ADMIN']);
  const parsed = createUserSchema.safeParse({
    nameEn: formData.get('nameEn'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });
  if (!parsed.success) return { error: 'invalidInput' };
  const { nameEn, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'emailTaken' };

  const passwordHash = bcrypt.hashSync(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash, nameEn, nameAr: '', role } });
  await logAudit({ action: 'USER_CREATED', actorId: session.userId, details: { targetUserId: user.id, email, role } });
  revalidatePath('/settings');
  return { ok: true };
}

async function assertNotLastActiveAdmin(userId: string, reason: string) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== 'ADMIN' || !target.active) return;
  const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', active: true } });
  if (activeAdmins <= 1) throw new Error(`Cannot ${reason} the last active administrator`);
}

export interface SimpleActionState {
  ok?: boolean;
  error?: string;
}

export async function updateUserRole(_prev: SimpleActionState, formData: FormData): Promise<SimpleActionState> {
  const session = await requireSession(['ADMIN']);
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!userId || !(ROLES as readonly string[]).includes(role)) return { error: 'invalidInput' };

  try {
    if (role !== 'ADMIN') await assertNotLastActiveAdmin(userId, 'demote');
  } catch {
    return { error: 'lastAdmin' };
  }

  const before = await prisma.user.findUnique({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { role: role as Role } });
  await logAudit({
    action: 'USER_ROLE_CHANGED',
    actorId: session.userId,
    details: { targetUserId: userId, fromRole: before?.role, toRole: role },
  });
  revalidatePath('/settings');
  return { ok: true };
}

export async function toggleUserActive(formData: FormData): Promise<SimpleActionState> {
  const session = await requireSession(['ADMIN']);
  const userId = String(formData.get('userId') ?? '');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'notFound' };
  if (user.id === session.userId) return { error: 'cannotDeactivateSelf' };

  if (user.active) {
    try {
      await assertNotLastActiveAdmin(userId, 'deactivate');
    } catch {
      return { error: 'lastAdmin' };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  await logAudit({
    action: user.active ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
    actorId: session.userId,
    details: { targetUserId: userId, email: user.email },
  });
  revalidatePath('/settings');
  return { ok: true };
}

// ---------- password change ----------

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(200),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'mismatch' });

export interface ChangePasswordState {
  ok?: boolean;
  error?: 'currentPasswordWrong' | 'invalidInput' | 'mismatch';
}

export async function changeOwnPassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await requireSession();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((i) => i.message === 'mismatch');
    return { error: mismatch ? 'mismatch' : 'invalidInput' };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!bcrypt.compareSync(parsed.data.currentPassword, user.passwordHash)) {
    return { error: 'currentPasswordWrong' };
  }

  const passwordHash = bcrypt.hashSync(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit({ action: 'PASSWORD_CHANGED', actorId: session.userId });
  return { ok: true };
}

// ---------- FATF country list maintenance ----------

export async function updateCountryFatfStatus(formData: FormData): Promise<SimpleActionState> {
  const session = await requireSession(['ADMIN']);
  const code = String(formData.get('code') ?? '');
  const fatfStatus = String(formData.get('fatfStatus') ?? '');
  if (!code || !(FATF_STATUSES as readonly string[]).includes(fatfStatus)) return { error: 'invalidInput' };

  const before = await prisma.country.findUnique({ where: { code } });
  await prisma.country.update({ where: { code }, data: { fatfStatus } });
  await logAudit({
    action: 'COUNTRY_FATF_STATUS_CHANGED',
    actorId: session.userId,
    details: { code, from: before?.fatfStatus, to: fatfStatus },
  });
  revalidatePath('/settings');
  return { ok: true };
}

// ---------- system settings ----------

const systemSettingsSchema = z.object({
  domesticCountryCode: z.string().trim().length(2),
  greyListRequiresDocument: z.enum(['true', 'false']),
});

export async function updateSystemSettings(formData: FormData): Promise<SimpleActionState> {
  const session = await requireSession(['ADMIN']);
  const parsed = systemSettingsSchema.safeParse({
    domesticCountryCode: formData.get('domesticCountryCode'),
    greyListRequiresDocument: formData.get('greyListRequiresDocument'),
  });
  if (!parsed.success) return { error: 'invalidInput' };

  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.domesticCountryCode },
      create: { key: SETTING_KEYS.domesticCountryCode, value: parsed.data.domesticCountryCode.toUpperCase() },
      update: { value: parsed.data.domesticCountryCode.toUpperCase() },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.greyListRequiresDocument },
      create: { key: SETTING_KEYS.greyListRequiresDocument, value: parsed.data.greyListRequiresDocument },
      update: { value: parsed.data.greyListRequiresDocument },
    }),
  ]);
  await logAudit({ action: 'SYSTEM_SETTING_CHANGED', actorId: session.userId, details: parsed.data });
  revalidatePath('/settings');
  return { ok: true };
}

// ---------- branding (colors + logo) ----------

const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'invalidHex');

const brandingSchema = z.object({
  primaryColor: hexColor,
  accentColor: hexColor,
  sidebarFromColor: hexColor,
  sidebarToColor: hexColor,
});

export interface BrandingState {
  ok?: boolean;
  error?: 'invalidInput';
}

export async function updateBranding(_prev: BrandingState, formData: FormData): Promise<BrandingState> {
  const session = await requireSession(['ADMIN']);
  const parsed = brandingSchema.safeParse({
    primaryColor: formData.get('primaryColor'),
    accentColor: formData.get('accentColor'),
    sidebarFromColor: formData.get('sidebarFromColor'),
    sidebarToColor: formData.get('sidebarToColor'),
  });
  if (!parsed.success) return { error: 'invalidInput' };

  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandPrimaryColor },
      create: { key: SETTING_KEYS.brandPrimaryColor, value: parsed.data.primaryColor },
      update: { value: parsed.data.primaryColor },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandAccentColor },
      create: { key: SETTING_KEYS.brandAccentColor, value: parsed.data.accentColor },
      update: { value: parsed.data.accentColor },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandSidebarFromColor },
      create: { key: SETTING_KEYS.brandSidebarFromColor, value: parsed.data.sidebarFromColor },
      update: { value: parsed.data.sidebarFromColor },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandSidebarToColor },
      create: { key: SETTING_KEYS.brandSidebarToColor, value: parsed.data.sidebarToColor },
      update: { value: parsed.data.sidebarToColor },
    }),
  ]);
  await logAudit({ action: 'BRANDING_UPDATED', actorId: session.userId, details: parsed.data });
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetBranding(): Promise<BrandingState> {
  const session = await requireSession(['ADMIN']);
  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandPrimaryColor },
      create: { key: SETTING_KEYS.brandPrimaryColor, value: BRAND_DEFAULTS.primaryColor },
      update: { value: BRAND_DEFAULTS.primaryColor },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandAccentColor },
      create: { key: SETTING_KEYS.brandAccentColor, value: BRAND_DEFAULTS.accentColor },
      update: { value: BRAND_DEFAULTS.accentColor },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandSidebarFromColor },
      create: { key: SETTING_KEYS.brandSidebarFromColor, value: BRAND_DEFAULTS.sidebarFromColor },
      update: { value: BRAND_DEFAULTS.sidebarFromColor },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTING_KEYS.brandSidebarToColor },
      create: { key: SETTING_KEYS.brandSidebarToColor, value: BRAND_DEFAULTS.sidebarToColor },
      update: { value: BRAND_DEFAULTS.sidebarToColor },
    }),
  ]);
  await logAudit({ action: 'BRANDING_UPDATED', actorId: session.userId, details: { reset: true } });
  revalidatePath('/', 'layout');
  return { ok: true };
}

const LOGO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export interface LogoUploadState {
  ok?: boolean;
  error?: 'fileTooLarge' | 'fileTypeNotAllowed' | 'uploadFailed';
}

export async function uploadBrandLogo(_prev: LogoUploadState, formData: FormData): Promise<LogoUploadState> {
  const session = await requireSession(['ADMIN']);
  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) return { error: 'uploadFailed' };
  if (file.size > MAX_LOGO_BYTES) return { error: 'fileTooLarge' };
  if (!(ALLOWED_LOGO_MIME as readonly string[]).includes(file.type)) return { error: 'fileTypeNotAllowed' };

  try {
    const ext = LOGO_EXT[file.type];
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const existing = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.brandLogoFile } });
    if (existing && existing.value !== `brand-logo.${ext}`) {
      await unlink(path.join(uploadsDir, existing.value)).catch(() => {});
    }

    const fileName = `brand-logo.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, fileName), buf);

    const versionRow = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.brandLogoVersion } });
    const nextVersion = String((Number(versionRow?.value ?? '0') || 0) + 1);

    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: SETTING_KEYS.brandLogoFile },
        create: { key: SETTING_KEYS.brandLogoFile, value: fileName },
        update: { value: fileName },
      }),
      prisma.systemSetting.upsert({
        where: { key: SETTING_KEYS.brandLogoVersion },
        create: { key: SETTING_KEYS.brandLogoVersion, value: nextVersion },
        update: { value: nextVersion },
      }),
    ]);
    await logAudit({ action: 'LOGO_UPLOADED', actorId: session.userId, details: { fileName, sizeBytes: file.size } });
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    console.error('uploadBrandLogo failed', e);
    return { error: 'uploadFailed' };
  }
}

export async function removeBrandLogo(): Promise<LogoUploadState> {
  const session = await requireSession(['ADMIN']);
  const existing = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.brandLogoFile } });
  if (existing) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await unlink(path.join(uploadsDir, existing.value)).catch(() => {});
    await prisma.systemSetting.delete({ where: { key: SETTING_KEYS.brandLogoFile } }).catch(() => {});
  }
  await logAudit({ action: 'LOGO_REMOVED', actorId: session.userId });
  revalidatePath('/', 'layout');
  return { ok: true };
}
