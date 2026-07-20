'use client';

import { useActionState, useState, useTransition } from 'react';
import type { User } from '@prisma/client';
import { Plus, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { StatCard } from '@/components/stat-card';
import { createStaffUser, updateUserRole, toggleUserActive, type CreateUserState } from '@/lib/settings/actions';
import { ROLES, type Role } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

function errorLabel(dict: ReturnType<typeof useI18n>['dict'], error?: string): string | null {
  if (!error) return null;
  switch (error) {
    case 'emailTaken':
      return dict.settings.users.emailTaken;
    case 'lastAdmin':
      return dict.settings.users.lastAdmin;
    case 'cannotDeactivateSelf':
      return dict.settings.users.cannotDeactivateSelf;
    default:
      return dict.settings.users.invalidInput;
  }
}

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<CreateUserState, FormData>(createStaffUser, {});

  if (state.ok && open) onClose();

  return (
    <Dialog open={open} onClose={onClose} title={dict.settings.users.createTitle}>
      <form action={formAction} className="space-y-4">
        {state.error && <Alert tone="danger">{errorLabel(dict, state.error)}</Alert>}
        <Field label={dict.settings.users.name} htmlFor="nameEn" required>
          <Input id="nameEn" name="nameEn" required />
        </Field>
        <Field label={dict.settings.users.email} htmlFor="email" required>
          <Input id="email" name="email" type="email" dir="ltr" required />
        </Field>
        <Field label={dict.settings.users.role} htmlFor="role" required>
          <Select id="role" name="role" defaultValue="FRONT_OFFICE" required>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {dict.roles[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={dict.settings.users.password} htmlFor="password" required hint={dict.settings.users.passwordHint}>
          <Input id="password" name="password" type="password" dir="ltr" minLength={8} required />
        </Field>
        <Button type="submit" className="w-full" loading={pending}>
          {pending ? dict.settings.users.creating : dict.settings.users.create}
        </Button>
      </form>
    </Dialog>
  );
}

function UserRow({ user, currentUserId }: { user: User; currentUserId: string }) {
  const { dict, locale } = useI18n();
  const [role, setRole] = useState(user.role as Role);
  const [active, setActive] = useState(user.active);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleRoleChange = (newRole: Role) => {
    const prevRole = role;
    setRole(newRole);
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('userId', user.id);
      fd.set('role', newRole);
      const res = await updateUserRole({}, fd);
      if (res.error) {
        setRole(prevRole);
        setError(errorLabel(dict, res.error));
      }
    });
  };

  const handleToggleActive = () => {
    if (active && !confirm(dict.settings.users.confirmDeactivate)) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('userId', user.id);
      const res = await toggleUserActive(fd);
      if (res.error) setError(errorLabel(dict, res.error));
      else setActive((a) => !a);
    });
  };

  const isSelf = user.id === currentUserId;

  return (
    <Tr>
      <Td className="font-medium text-ink">
        {locale === 'ar' && user.nameAr ? user.nameAr : user.nameEn}
        {isSelf && <span className="ms-2 text-xs text-faint">({dict.common.you})</span>}
      </Td>
      <Td dir="ltr" className="text-start">
        {user.email}
      </Td>
      <Td>
        <Select
          value={role}
          disabled={pending || isSelf}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          className="h-9 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {dict.roles[r]}
            </option>
          ))}
        </Select>
      </Td>
      <Td>
        <Badge tone={active ? 'green' : 'slate'}>{active ? dict.settings.users.active : dict.settings.users.inactive}</Badge>
      </Td>
      <Td className="whitespace-nowrap text-xs text-faint">{formatDate(user.createdAt, locale)}</Td>
      <Td>
        <Button type="button" variant="secondary" size="sm" onClick={handleToggleActive} disabled={pending || isSelf}>
          {active ? dict.settings.users.deactivate : dict.settings.users.activate}
        </Button>
        {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      </Td>
    </Tr>
  );
}

export function UsersPanel({
  users,
  roleCounts,
  currentUserId,
}: {
  users: User[];
  roleCounts: Record<Role, number>;
  currentUserId: string;
}) {
  const { dict } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((r) => (
          <StatCard key={r} label={dict.roles[r]} value={roleCounts[r]} icon={ShieldCheck} tone="blue" />
        ))}
      </div>

      <Card>
        <CardHeader
          title={dict.settings.users.title}
          actions={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              {dict.settings.users.addUser}
            </Button>
          }
        />
        <CardBody className="p-0">
          <Table>
            <THead>
              <Tr>
                <Th>{dict.settings.users.name}</Th>
                <Th className="text-start">{dict.settings.users.email}</Th>
                <Th>{dict.settings.users.role}</Th>
                <Th>{dict.settings.users.status}</Th>
                <Th>{dict.settings.users.createdAt}</Th>
                <Th>{dict.settings.users.actions}</Th>
              </Tr>
            </THead>
            <TBody>
              {users.map((u) => (
                <UserRow key={u.id} user={u} currentUserId={currentUserId} />
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
