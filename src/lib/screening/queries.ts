import 'server-only';
import { prisma } from '@/lib/db';
import { SCREENING_LISTS, LOADED_LIST_SOURCES, type ScreeningListMeta } from './lists';

export interface ScreeningListWithCount extends ScreeningListMeta {
  recordCount: number;
}

export async function getScreeningListStatus(): Promise<ScreeningListWithCount[]> {
  const counts = await prisma.sanctionedEntity.groupBy({ by: ['listSource'], _count: { listSource: true } });
  const countMap = new Map(counts.map((c) => [c.listSource, c._count.listSource]));
  return SCREENING_LISTS.map((l) => ({ ...l, recordCount: countMap.get(l.code) ?? 0 }));
}

export async function getTotalSanctionedEntityCount(): Promise<number> {
  return prisma.sanctionedEntity.count();
}

const BROWSE_PAGE_SIZE = 25;

export async function browseSanctionedEntities(query: string, page: number) {
  const where = query.trim()
    ? {
        OR: [
          { fullName: { contains: query.trim() } },
          { aliasesJson: { contains: query.trim() } },
        ],
      }
    : {};
  const [total, rows] = await Promise.all([
    prisma.sanctionedEntity.count({ where }),
    prisma.sanctionedEntity.findMany({
      where,
      orderBy: { fullName: 'asc' },
      skip: (page - 1) * BROWSE_PAGE_SIZE,
      take: BROWSE_PAGE_SIZE,
    }),
  ]);
  return { total, rows, pageCount: Math.max(1, Math.ceil(total / BROWSE_PAGE_SIZE)) };
}

/** All loaded sanctioned entities — small enough (low hundreds) to score entirely in memory. */
export async function getAllSanctionedEntitiesForScreening() {
  return prisma.sanctionedEntity.findMany({ where: { listSource: { in: LOADED_LIST_SOURCES } } });
}
