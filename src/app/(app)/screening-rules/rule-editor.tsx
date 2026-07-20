'use client';

import { useActionState, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { CheckboxRow } from '@/components/kyc/shared';
import { createScreeningRule, type CreateRuleState } from '@/lib/transactions/actions';
import { RULE_TYPES, RULE_PRIORITIES, RULE_ACTIONS, TRANSACTION_TYPES } from '@/lib/constants';
import type { RuleType } from '@/lib/constants';

export function RuleEditor() {
  const { dict } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateRuleState, FormData>(createScreeningRule, {});
  const [ruleType, setRuleType] = useState<RuleType>('VELOCITY_COUNT_SUM');
  const [name, setName] = useState('');
  const [velocityType, setVelocityType] = useState('ANY');
  const [windowHours, setWindowHours] = useState(72);
  const [minCount, setMinCount] = useState(5);
  const [minAmountKd, setMinAmountKd] = useState(8000);
  const [maxAmountKd, setMaxAmountKd] = useState(9999);
  const [largeType, setLargeType] = useState('ANY');
  const [thresholdAmountKd, setThresholdAmountKd] = useState(10000);
  const [includeGreylist, setIncludeGreylist] = useState(true);
  const [includeBlacklist, setIncludeBlacklist] = useState(true);

  if (state.ok) {
    router.refresh();
  }

  const preview = useMemo(() => {
    const label = name || '(unnamed rule)';
    if (ruleType === 'VELOCITY_COUNT_SUM') {
      return `IF transaction.type ${velocityType === 'ANY' ? '' : `== "${velocityType}" `}AND count(customer.transactions, "${windowHours}h") >= ${minCount}\n  AND sum(customer.transactions.amountKd) BETWEEN ${minAmountKd} AND ${maxAmountKd}\nTHEN alert("${label}")`;
    }
    if (ruleType === 'LARGE_SINGLE_TRANSACTION') {
      return `IF transaction.type ${largeType === 'ANY' ? '' : `== "${largeType}" `}AND transaction.amountKd >= ${thresholdAmountKd}\nTHEN alert("${label}")`;
    }
    return `IF transaction.counterpartyCountry.fatfStatus IN (${[includeGreylist && 'GREY', includeBlacklist && 'BLACK'].filter(Boolean).join(', ') || 'none selected'})\nTHEN alert("${label}")`;
  }, [ruleType, name, velocityType, windowHours, minCount, minAmountKd, maxAmountKd, largeType, thresholdAmountKd, includeGreylist, includeBlacklist]);

  return (
    <Card>
      <CardHeader title={dict.screeningRules.ruleEditor} />
      <CardBody>
        <form action={formAction} className="space-y-4">
          {state.error && <Alert tone="danger">{dict.screeningRules.invalidInput}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={dict.screeningRules.ruleName} htmlFor="name" required>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={dict.screeningRules.ruleType} htmlFor="ruleType" required>
              <Select
                id="ruleType"
                name="ruleType"
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as RuleType)}
              >
                {RULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {dict.screeningRules.ruleTypes[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {ruleType === 'VELOCITY_COUNT_SUM' && (
            <div className="grid gap-4 rounded-xl border border-hairline bg-subtle p-4 sm:grid-cols-2">
              <Field label={dict.screeningRules.transactionTypeLabel} htmlFor="velocityTransactionType">
                <Select
                  id="velocityTransactionType"
                  name="velocityTransactionType"
                  value={velocityType}
                  onChange={(e) => setVelocityType(e.target.value)}
                >
                  <option value="ANY">{dict.screeningRules.anyType}</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {dict.transactionTypes[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={dict.screeningRules.windowHours} htmlFor="windowHours">
                <Input
                  id="windowHours"
                  name="windowHours"
                  type="number"
                  min="1"
                  dir="ltr"
                  value={windowHours}
                  onChange={(e) => setWindowHours(Number(e.target.value))}
                />
              </Field>
              <Field label={dict.screeningRules.minCount} htmlFor="minCount">
                <Input
                  id="minCount"
                  name="minCount"
                  type="number"
                  min="1"
                  dir="ltr"
                  value={minCount}
                  onChange={(e) => setMinCount(Number(e.target.value))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={dict.screeningRules.minAmountKd} htmlFor="minAmountKd">
                  <Input
                    id="minAmountKd"
                    name="minAmountKd"
                    type="number"
                    min="0"
                    dir="ltr"
                    value={minAmountKd}
                    onChange={(e) => setMinAmountKd(Number(e.target.value))}
                  />
                </Field>
                <Field label={dict.screeningRules.maxAmountKd} htmlFor="maxAmountKd">
                  <Input
                    id="maxAmountKd"
                    name="maxAmountKd"
                    type="number"
                    min="0"
                    dir="ltr"
                    value={maxAmountKd}
                    onChange={(e) => setMaxAmountKd(Number(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          )}

          {ruleType === 'LARGE_SINGLE_TRANSACTION' && (
            <div className="grid gap-4 rounded-xl border border-hairline bg-subtle p-4 sm:grid-cols-2">
              <Field label={dict.screeningRules.transactionTypeLabel} htmlFor="largeTransactionType">
                <Select
                  id="largeTransactionType"
                  name="largeTransactionType"
                  value={largeType}
                  onChange={(e) => setLargeType(e.target.value)}
                >
                  <option value="ANY">{dict.screeningRules.anyType}</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {dict.transactionTypes[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={dict.screeningRules.thresholdAmountKd} htmlFor="thresholdAmountKd">
                <Input
                  id="thresholdAmountKd"
                  name="thresholdAmountKd"
                  type="number"
                  min="0"
                  dir="ltr"
                  value={thresholdAmountKd}
                  onChange={(e) => setThresholdAmountKd(Number(e.target.value))}
                />
              </Field>
            </div>
          )}

          {ruleType === 'HIGH_RISK_COUNTRY' && (
            <div className="space-y-2 rounded-xl border border-hairline bg-subtle p-4">
              <CheckboxRow
                id="includeGreylist"
                label={dict.screeningRules.includeGreylist}
                checked={includeGreylist}
                onChange={setIncludeGreylist}
              />
              <CheckboxRow
                id="includeBlacklist"
                label={dict.screeningRules.includeBlacklist}
                checked={includeBlacklist}
                onChange={setIncludeBlacklist}
              />
              <input type="hidden" name="includeGreylist" value={includeGreylist ? 'on' : ''} />
              <input type="hidden" name="includeBlacklist" value={includeBlacklist ? 'on' : ''} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={dict.screeningRules.priority} htmlFor="priority" required>
              <Select id="priority" name="priority" defaultValue="CRITICAL">
                {RULE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {dict.riskAssessment.bands[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.screeningRules.action} htmlFor="action" required>
              <Select id="action" name="action" defaultValue="ALERT_ONLY">
                {RULE_ACTIONS.map((a) => (
                  <option key={a} value={a} disabled={a === 'CREATE_STR'}>
                    {dict.screeningRules.actionOptions[a]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">{dict.screeningRules.rulePreviewTitle}</p>
            <pre className="overflow-x-auto rounded-lg bg-ink p-4 text-xs leading-relaxed text-emerald-300">{preview}</pre>
            <p className="mt-1 text-xs text-faint">{dict.screeningRules.structuredNote}</p>
          </div>

          <Button type="submit" loading={pending}>
            {pending ? dict.screeningRules.saving : dict.screeningRules.saveAsDraft}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
