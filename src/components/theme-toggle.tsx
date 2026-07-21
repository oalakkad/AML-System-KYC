'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/use-theme';
import { useI18n } from '@/lib/i18n/client';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { dict } = useI18n();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex size-8.5 items-center justify-center rounded-xl text-muted transition-colors hover:bg-subtle hover:text-ink"
      aria-label={isDark ? dict.common.lightMode : dict.common.darkMode}
      title={isDark ? dict.common.lightMode : dict.common.darkMode}
    >
      {isDark ? <Sun className="size-4.5" aria-hidden /> : <Moon className="size-4.5" aria-hidden />}
    </button>
  );
}
