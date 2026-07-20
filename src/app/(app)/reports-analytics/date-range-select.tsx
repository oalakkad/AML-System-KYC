'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { Select } from '@/components/ui/input';

export function DateRangeSelect({ days }: { days: number }) {
  const { dict } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('days', next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={days} onChange={(e) => handleChange(e.target.value)} className="print:hidden">
      <option value={7}>{dict.reports.last7}</option>
      <option value={30}>{dict.reports.last30}</option>
      <option value={90}>{dict.reports.last90}</option>
    </Select>
  );
}
