'use client';

// One consistent file-input skin — was duplicated with two slightly
// different treatments (bordered-white vs borderless-subtle) across
// documents-panel.tsx, portal-documents-panel.tsx, branding-panel.tsx, and
// import-transactions-dialog.tsx. Standardizes on the bordered look to match
// Input/Select.

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const FileInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="file"
      className={cn(
        'cursor-pointer text-sm text-muted file:me-3 file:cursor-pointer file:rounded-md file:border file:border-hairline-strong file:bg-card file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-subtle',
        className,
      )}
      {...props}
    />
  ),
);
FileInput.displayName = 'FileInput';
