'use client';

// Accessible modal built on the native <dialog> element.

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Prevent closing via Esc / backdrop (for mandatory flows) */
  dismissible?: boolean;
  className?: string;
}

export function Dialog({ open, onClose, title, children, dismissible = true, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        if (!dismissible) e.preventDefault();
        else onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto w-full max-w-lg rounded-xl border border-hairline bg-white p-0 text-ink shadow-pop backdrop:bg-slate-900/40',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-subtle hover:text-ink"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
