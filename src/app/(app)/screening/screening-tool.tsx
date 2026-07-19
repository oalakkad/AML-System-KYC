'use client';

import { useActionState, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckboxRow } from '@/components/kyc/shared';
import { screenName, type ScreenState } from '@/lib/screening/actions';
import type { ScreeningListWithCount } from '@/lib/screening/queries';

function listBadgeTone(status: string) {
  if (status === 'LOADED') return 'green';
  if (status === 'LINKING') return 'amber';
  return 'slate';
}

export function ScreeningTool({ lists }: { lists: ScreeningListWithCount[] }) {
  const { dict, locale } = useI18n();
  const [state, formAction, pending] = useActionState<ScreenState, FormData>(screenName, {});
  const [arabicPhonetic, setArabicPhonetic] = useState(false);
  const [threshold, setThreshold] = useState(80);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-5">
        <Card>
          <CardBody>
            <form action={formAction} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
                  <Input name="query" defaultValue={state.query} placeholder={dict.screening.searchPlaceholder} className="ps-9" required />
                </div>
                <select
                  name="threshold"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="h-11 rounded-md border border-hairline-strong bg-white px-3 text-sm"
                >
                  {[60, 70, 80, 90].map((t) => (
                    <option key={t} value={t}>
                      {t}% {dict.screening.threshold}
                    </option>
                  ))}
                </select>
                <Button type="submit" loading={pending}>
                  <Search className="size-4" aria-hidden />
                  {pending ? dict.screening.searching : dict.screening.search}
                </Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary-soft px-3 py-3 text-sm text-primary">
                  <input type="checkbox" checked readOnly className="size-4 rounded border-hairline-strong" />
                  {dict.screening.fuzzyMatch}
                </span>
                <CheckboxRow
                  id="arabicPhonetic"
                  label={dict.screening.arabicPhonetic}
                  checked={arabicPhonetic}
                  onChange={setArabicPhonetic}
                />
                <input type="hidden" name="arabicPhonetic" value={arabicPhonetic ? 'on' : 'off'} />
                <span className="flex items-center gap-2 text-sm text-faint" title={dict.screening.networkAnalysisComingSoon}>
                  <input type="checkbox" disabled className="size-4 rounded border-hairline-strong" />
                  {dict.screening.networkAnalysis}
                  <Badge tone="slate">{dict.screening.networkAnalysisComingSoon}</Badge>
                </span>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="min-h-40">
            {!state.matches ? (
              <p className="py-10 text-center text-sm text-muted">
                {state.error === 'emptyQuery' ? dict.screening.emptyQuery : dict.screening.noSearchYet}
              </p>
            ) : state.matches.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">{dict.screening.noMatches}</p>
            ) : (
              <ul className="space-y-3">
                {state.matches.map((m) => (
                  <li key={m.id} className="rounded-xl border border-hairline p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink">{m.fullName}</p>
                      <Badge tone={m.score >= 90 ? 'red' : m.score >= 80 ? 'amber' : 'slate'}>
                        {dict.screening.matchScore}: {m.score}%
                      </Badge>
                    </div>
                    {m.aliases.length > 0 && (
                      <p className="mt-1 text-xs text-faint">
                        {dict.screening.aliases}: {m.aliases.join(', ')}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span>
                        {dict.screening.listSource}: {m.listSource}
                      </span>
                      {m.programs && (
                        <span>
                          {dict.screening.program}: {m.programs}
                        </span>
                      )}
                      {m.nationality && (
                        <span>
                          {dict.screening.nationality}: {m.nationality}
                        </span>
                      )}
                      {m.dob && (
                        <span>
                          {dict.screening.dob}: {m.dob}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <aside>
        <Card>
          <CardHeader title={dict.screening.loadedListsTitle} />
          <CardBody className="space-y-3">
            {lists.map((l) => (
              <div key={l.code} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{locale === 'ar' ? l.nameAr : l.nameEn}</p>
                  {l.status === 'LOADED' && (
                    <p className="text-xs text-faint">
                      {l.recordCount} {dict.screening.records}
                    </p>
                  )}
                </div>
                <Badge tone={listBadgeTone(l.status)}>{dict.screening.status[l.status]}</Badge>
              </div>
            ))}
            <div className="flex items-start gap-2 rounded-lg bg-subtle p-3 text-xs text-faint">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{dict.screening.listsPageSubtitle}</span>
            </div>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
