import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { SETTING_KEYS, type FatfStatus, type Role } from '@/lib/constants';
import type { FatfSettings } from './risk-input';

/**
 * Front office sees cases they personally made AND any client self-submitted
 * case (clientMakerId set, no staff maker) — a client-created KYC skips the
 * front-office step, but relationship managers still want visibility into it.
 * Every other role already sees everything (no filter).
 */
export function frontOfficeScopedWhere(role: Role, userId: string): Prisma.KycCaseWhereInput {
  if (role !== 'FRONT_OFFICE') return {};
  return { OR: [{ makerId: userId }, { clientMakerId: { not: null } }] };
}

export async function getCountryOptions() {
  return prisma.country.findMany({
    where: { active: true },
    select: { code: true, nameEn: true, nameAr: true, fatfStatus: true },
    orderBy: { nameEn: 'asc' },
  });
}

export async function getFatfSettings(): Promise<FatfSettings> {
  const settings = await prisma.systemSetting.findMany();
  const map = new Map(settings.map((s) => [s.key, s.value]));
  return {
    domesticCountryCode: map.get(SETTING_KEYS.domesticCountryCode) ?? 'KW',
    greyListRequiresDocument: (map.get(SETTING_KEYS.greyListRequiresDocument) ?? 'true') === 'true',
  };
}

export async function getFatfMap(): Promise<Map<string, FatfStatus>> {
  const countries = await prisma.country.findMany({ select: { code: true, fatfStatus: true } });
  return new Map(countries.map((c) => [c.code, c.fatfStatus as FatfStatus]));
}
