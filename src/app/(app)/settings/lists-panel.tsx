'use client';

import { useMemo, useState, useTransition } from 'react';
import type { Country } from '@prisma/client';
import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { CheckboxRow } from '@/components/kyc/shared';
import { updateCountryFatfStatus, updateSystemSettings } from '@/lib/settings/actions';
import { FATF_STATUSES, type FatfStatus } from '@/lib/constants';

function CountryRow({ country, locale }: { country: Country; locale: 'en' | 'ar' }) {
  const { dict } = useI18n();
  const [status, setStatus] = useState(country.fatfStatus as FatfStatus);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleChange = (next: FatfStatus) => {
    const prev = status;
    setStatus(next);
    setSaved(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('code', country.code);
      fd.set('fatfStatus', next);
      const res = await updateCountryFatfStatus(fd);
      if (res.error) setStatus(prev);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  };

  return (
    <Tr>
      <Td className="font-medium text-ink">{locale === 'ar' ? country.nameAr : country.nameEn}</Td>
      <Td dir="ltr" className="text-start text-xs text-faint">
        {country.code}
      </Td>
      <Td>
        <Select
          value={status}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value as FatfStatus)}
          className="h-9 w-32 text-sm"
        >
          {FATF_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Td>
      <Td className="text-xs text-emerald-600">{saved && dict.settings.lists.saved}</Td>
    </Tr>
  );
}

export function ListsPanel({
  countries,
  settings,
}: {
  countries: Country[];
  settings: { domesticCountryCode: string; greyListRequiresDocument: boolean };
}) {
  const { dict, locale } = useI18n();
  const [q, setQ] = useState('');
  const [settingsState, setSettingsState] = useState(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle
      ? countries.filter(
          (c) =>
            c.nameEn.toLowerCase().includes(needle) ||
            c.nameAr.includes(q.trim()) ||
            c.code.toLowerCase().includes(needle),
        )
      : countries.filter((c) => c.fatfStatus !== 'NONE');
    return base.slice(0, 100);
  }, [countries, q]);

  const handleSaveSettings = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateSystemSettings(formData);
      if (!res.error) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 1500);
      }
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title={dict.settings.lists.screeningSettingsTitle} />
        <CardBody>
          <form action={handleSaveSettings} className="max-w-sm space-y-4">
            {settingsSaved && <Alert tone="success">{dict.settings.lists.saved}</Alert>}
            <Field
              label={dict.settings.lists.domesticCountry}
              htmlFor="domesticCountryCode"
              hint={dict.settings.lists.domesticCountryHint}
            >
              <Input
                id="domesticCountryCode"
                name="domesticCountryCode"
                dir="ltr"
                maxLength={2}
                defaultValue={settingsState.domesticCountryCode}
                onChange={(e) => setSettingsState((s) => ({ ...s, domesticCountryCode: e.target.value }))}
              />
            </Field>
            <CheckboxRow
              id="greyListRequiresDocument"
              label={dict.settings.lists.greyListRequiresDocument}
              checked={settingsState.greyListRequiresDocument}
              onChange={(checked) => setSettingsState((s) => ({ ...s, greyListRequiresDocument: checked }))}
            />
            <input
              type="hidden"
              name="greyListRequiresDocument"
              value={settingsState.greyListRequiresDocument ? 'true' : 'false'}
            />
            <Button type="submit" size="sm" loading={pending}>
              {dict.settings.lists.save}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={dict.settings.lists.fatfTitle} description={dict.settings.lists.fatfHint} />
        <CardBody className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" placeholder={dict.common.search} />
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>{dict.settings.lists.country}</Th>
                <Th className="text-start">Code</Th>
                <Th>{dict.settings.lists.fatfStatus}</Th>
                <Th></Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <CountryRow key={c.code} country={c} locale={locale} />
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
