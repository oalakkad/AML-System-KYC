'use server';

import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { matchScore } from './similarity';
import { getAllSanctionedEntitiesForScreening } from './queries';

export interface ScreeningMatch {
  id: string;
  fullName: string;
  aliases: string[];
  listSource: string;
  entityType: string;
  programs: string;
  nationality: string | null;
  dob: string | null;
  score: number;
}

export interface ScreenState {
  query?: string;
  matches?: ScreeningMatch[];
  error?: 'emptyQuery';
}

const MAX_RESULTS = 50;

export async function screenName(_prev: ScreenState, formData: FormData): Promise<ScreenState> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN']);
  const query = String(formData.get('query') ?? '').trim();
  const arabicPhonetic = formData.get('arabicPhonetic') === 'on';
  const threshold = Math.min(100, Math.max(0, Number(formData.get('threshold') ?? '80') || 80));
  if (!query) return { error: 'emptyQuery' };

  const entities = await getAllSanctionedEntitiesForScreening();
  const matches: ScreeningMatch[] = entities
    .map((e) => {
      const aliases = e.aliasesJson ? (JSON.parse(e.aliasesJson) as string[]) : [];
      const score = matchScore(query, [e.fullName, ...aliases], { arabicPhonetic });
      return {
        id: e.id,
        fullName: e.fullName,
        aliases,
        listSource: e.listSource,
        entityType: e.entityType,
        programs: e.programs ?? '',
        nationality: e.nationality,
        dob: e.dob,
        score,
      };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  await logAudit({
    action: 'SANCTIONS_SCREENED',
    actorId: session.userId,
    details: { query, threshold, arabicPhonetic, resultCount: matches.length },
  });

  return { query, matches };
}
