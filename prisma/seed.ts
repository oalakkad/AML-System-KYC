// Seed: countries (EN/AR names via Intl.DisplayNames, FATF flags per the
// June 2026 plenary), demo users, and system settings. Idempotent (upserts).
// Run: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SANCTIONS_SEED_DATA } from './seed-data/sanctions';
import { seedDemoData } from './seed-data/demo';

const prisma = new PrismaClient();

// ISO 3166-1 alpha-2 (uninhabited territories excluded)
const ISO_CODES = (
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT ' +
  'BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ' +
  'ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ' +
  'ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS ' +
  'LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG ' +
  'NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD ' +
  'SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
  'UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ');

// FATF lists — June 2026 plenary (update after each plenary via admin/DB).
const FATF_BLACK = new Set(['IR', 'KP', 'MM']);
const FATF_GREY = new Set([
  'AO', // Angola
  'BO', // Bolivia
  'BA', // Bosnia and Herzegovina
  'BG', // Bulgaria
  'CM', // Cameroon
  'CI', // Côte d'Ivoire
  'CD', // DR Congo
  'HT', // Haiti
  'IQ', // Iraq
  'KE', // Kenya
  'KW', // Kuwait
  'LA', // Laos
  'LB', // Lebanon
  'MC', // Monaco
  'NP', // Nepal
  'PG', // Papua New Guinea
  'SS', // South Sudan
  'SY', // Syria
  'VE', // Venezuela
  'VN', // Vietnam
  'VG', // Virgin Islands (UK)
  'YE', // Yemen
]);

const DEMO_USERS = [
  {
    email: 'employee@aml.local',
    password: 'Employee@123',
    nameEn: 'Front Office Employee',
    nameAr: 'موظف الخط الأمامي',
    role: 'FRONT_OFFICE',
  },
  {
    email: 'compliance@aml.local',
    password: 'Compliance@123',
    nameEn: 'Compliance Officer',
    nameAr: 'مسؤول الامتثال',
    role: 'COMPLIANCE_OFFICER',
  },
  {
    email: 'manager@aml.local',
    password: 'Manager@123',
    nameEn: 'Senior Manager',
    nameAr: 'المدير الأعلى',
    role: 'SENIOR_MANAGER',
  },
  {
    email: 'admin@aml.local',
    password: 'Admin@123',
    nameEn: 'System Administrator',
    nameAr: 'مسؤول النظام',
    role: 'ADMIN',
  },
];

async function main() {
  const en = new Intl.DisplayNames(['en'], { type: 'region' });
  const ar = new Intl.DisplayNames(['ar'], { type: 'region' });

  for (const code of ISO_CODES) {
    const nameEn = en.of(code);
    const nameAr = ar.of(code);
    if (!nameEn || !nameAr || nameEn === code) continue;
    const fatfStatus = FATF_BLACK.has(code) ? 'BLACK' : FATF_GREY.has(code) ? 'GREY' : 'NONE';
    await prisma.country.upsert({
      where: { code },
      create: { code, nameEn, nameAr, fatfStatus },
      update: { nameEn, nameAr, fatfStatus },
    });
  }
  console.log(`Seeded ${ISO_CODES.length} countries (${FATF_BLACK.size} black-listed, ${FATF_GREY.size} grey-listed)`);

  for (const u of DEMO_USERS) {
    const passwordHash = bcrypt.hashSync(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, passwordHash, nameEn: u.nameEn, nameAr: u.nameAr, role: u.role },
      update: { nameEn: u.nameEn, nameAr: u.nameAr, role: u.role },
    });
  }
  console.log(`Seeded ${DEMO_USERS.length} demo users`);

  const settings: Record<string, string> = {
    domesticCountryCode: 'KW',
    greyListRequiresDocument: 'true',
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({ where: { key }, create: { key, value }, update: {} });
  }
  console.log('Seeded system settings');

  // No natural unique key on SanctionedEntity — reseed idempotently by
  // clearing each list source before re-inserting its snapshot.
  for (const source of ['OFAC_SDN', 'UN_CONSOLIDATED'] as const) {
    await prisma.sanctionedEntity.deleteMany({ where: { listSource: source } });
  }
  await prisma.sanctionedEntity.createMany({
    data: SANCTIONS_SEED_DATA.map((r) => ({
      fullName: r.fullName,
      aliasesJson: JSON.stringify(r.aliases),
      listSource: r.listSource,
      entityType: r.entityType,
      programs: r.programs,
      nationality: r.nationality,
      dob: r.dob,
    })),
  });
  console.log(`Seeded ${SANCTIONS_SEED_DATA.length} sanctions list records (OFAC SDN + UN Consolidated snapshot)`);

  // Realistic demo dataset (fictional KYC cases, transactions, alerts,
  // investigations, STR reports) for showcasing the platform. Guarded so
  // re-running the seed never duplicates it or touches real user data.
  const demoFlag = await prisma.systemSetting.findUnique({ where: { key: 'demoDataSeeded' } });
  if (demoFlag?.value === 'true') {
    console.log('Demo dataset already seeded — skipping (delete the demoDataSeeded system setting to reseed)');
  } else {
    await seedDemoData(prisma);
    await prisma.systemSetting.upsert({
      where: { key: 'demoDataSeeded' },
      create: { key: 'demoDataSeeded', value: 'true' },
      update: { value: 'true' },
    });
    console.log('Seeded demo dataset (KYC cases, transactions, alerts, investigations, STR reports)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
