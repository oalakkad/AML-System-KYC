'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Upload, Trash2, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  updateBranding,
  resetBranding,
  uploadBrandLogo,
  removeBrandLogo,
  type BrandingState,
  type LogoUploadState,
} from '@/lib/settings/actions';
import type { BrandSettings } from '@/lib/settings/queries';

const BRAND_VARS = {
  primaryColor: '--color-primary',
  accentColor: '--color-accent',
  sidebarFromColor: '--color-sidebar-from',
  sidebarToColor: '--color-sidebar-to',
} as const;

function ColorField({
  id,
  name,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-md border border-hairline-strong bg-white p-1"
        />
        <Input
          name={name}
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="font-mono uppercase"
        />
      </div>
    </Field>
  );
}

export function BrandingPanel({
  brand,
  defaults,
}: {
  brand: BrandSettings;
  defaults: { primaryColor: string; accentColor: string; sidebarFromColor: string; sidebarToColor: string };
}) {
  const { dict } = useI18n();
  const router = useRouter();

  const [colors, setColors] = useState({
    primaryColor: brand.primaryColor,
    accentColor: brand.accentColor,
    sidebarFromColor: brand.sidebarFromColor,
    sidebarToColor: brand.sidebarToColor,
  });
  const [colorState, colorAction, colorPending] = useActionState<BrandingState, FormData>(updateBranding, {});
  const [resetPending, startReset] = useTransition();

  const [logoState, logoAction, logoPending] = useActionState<LogoUploadState, FormData>(uploadBrandLogo, {});
  const [removePending, startRemove] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setColor = (key: keyof typeof colors, value: string) => {
    setColors((c) => ({ ...c, [key]: value }));
    // Live preview: reflect the pick immediately, before Save is even clicked.
    document.documentElement.style.setProperty(BRAND_VARS[key], value);
  };

  const handleReset = () => {
    startReset(async () => {
      await resetBranding();
      setColors(defaults);
      for (const key of Object.keys(BRAND_VARS) as (keyof typeof BRAND_VARS)[]) {
        document.documentElement.style.setProperty(BRAND_VARS[key], defaults[key]);
      }
      router.refresh();
    });
  };

  const handleRemoveLogo = () => {
    startRemove(async () => {
      await removeBrandLogo();
      setLogoPreview(null);
      router.refresh();
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  };

  const errorLabel = (error?: string) => {
    switch (error) {
      case 'invalidHex':
      case 'invalidInput':
        return dict.settings.branding.invalidHex;
      case 'fileTooLarge':
        return dict.settings.branding.logoFileTooLarge;
      case 'fileTypeNotAllowed':
        return dict.settings.branding.logoFileTypeNotAllowed;
      case 'uploadFailed':
        return dict.settings.branding.logoUploadFailed;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title={dict.settings.branding.colorsTitle} description={dict.settings.branding.colorsHint} />
        <CardBody>
          <form action={colorAction} className="space-y-4">
            {colorState.ok && <Alert tone="success">{dict.settings.branding.saved}</Alert>}
            {colorState.error && <Alert tone="danger">{errorLabel(colorState.error)}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                id="primaryColor"
                name="primaryColor"
                label={dict.settings.branding.primaryColor}
                hint={dict.settings.branding.primaryColorHint}
                value={colors.primaryColor}
                onChange={(v) => setColor('primaryColor', v)}
              />
              <ColorField
                id="accentColor"
                name="accentColor"
                label={dict.settings.branding.accentColor}
                hint={dict.settings.branding.accentColorHint}
                value={colors.accentColor}
                onChange={(v) => setColor('accentColor', v)}
              />
              <ColorField
                id="sidebarFromColor"
                name="sidebarFromColor"
                label={dict.settings.branding.sidebarFromColor}
                value={colors.sidebarFromColor}
                onChange={(v) => setColor('sidebarFromColor', v)}
              />
              <ColorField
                id="sidebarToColor"
                name="sidebarToColor"
                label={dict.settings.branding.sidebarToColor}
                value={colors.sidebarToColor}
                onChange={(v) => setColor('sidebarToColor', v)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={colorPending}>
                {colorPending ? dict.settings.branding.saving : dict.settings.branding.save}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleReset} loading={resetPending}>
                <RotateCcw className="size-4" aria-hidden />
                {dict.settings.branding.resetDefault}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={dict.settings.branding.logoTitle} description={dict.settings.branding.logoHint} />
        <CardBody className="space-y-4">
          {logoState.ok && <Alert tone="success">{dict.settings.branding.logoUploaded}</Alert>}
          {logoState.error && <Alert tone="danger">{errorLabel(logoState.error)}</Alert>}

          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-hairline bg-subtle">
              {logoPreview || brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview ?? brand.logoUrl ?? undefined}
                  alt={dict.settings.branding.logoCurrentAlt}
                  className="max-h-16 max-w-16 object-contain"
                />
              ) : (
                <ImageIcon className="size-8 text-faint" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {!brand.logoUrl && !logoPreview && (
                <p className="mb-2 text-sm text-muted">{dict.settings.branding.logoNone}</p>
              )}
              <form action={logoAction} className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  name="logo"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={onFileChange}
                  className="max-w-full text-sm text-muted file:me-3 file:rounded-md file:border-0 file:bg-subtle file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-hairline"
                />
                <Button type="submit" size="sm" loading={logoPending}>
                  <Upload className="size-4" aria-hidden />
                  {logoPending ? dict.settings.branding.logoUploading : dict.settings.branding.logoUpload}
                </Button>
                {brand.logoUrl && (
                  <Button type="button" variant="secondary" size="sm" onClick={handleRemoveLogo} loading={removePending}>
                    <Trash2 className="size-4" aria-hidden />
                    {dict.settings.branding.logoRemove}
                  </Button>
                )}
              </form>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
