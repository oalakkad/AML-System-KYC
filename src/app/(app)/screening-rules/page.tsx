import { requireSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getScreeningRules } from '@/lib/transactions/queries';
import { RuleEditor } from './rule-editor';
import { RulesList } from './rules-list';

export default async function ScreeningRulesPage() {
  await requireSession(['COMPLIANCE_OFFICER', 'ADMIN']);
  const { dict } = await getDict();
  const rules = await getScreeningRules();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{dict.screeningRules.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.screeningRules.subtitle}</p>
      </div>
      <RuleEditor />
      <RulesList rules={rules} />
    </div>
  );
}
