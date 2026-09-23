'use client';

import { useVisualTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import type { Translations } from '@/lib/i18n';

type ThemePickerProps = {
  t: Translations;
  compact?: boolean;
};

export function ThemePicker({ t, compact = false }: ThemePickerProps) {
  const { theme, setTheme } = useVisualTheme();

  return (
    <div className={cn('space-y-2', compact ? 'px-2 pb-1' : 'space-y-3')}>
      <p
        className={cn(
          'font-semibold uppercase tracking-[0.2em] text-white/50',
          compact ? 'px-1 text-[10px]' : 'text-xs'
        )}
      >
        {t.themeLabel}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ThemeOption
          active={theme === 'brutal'}
          label={t.themeBrutal}
          preview="brutal"
          onClick={() => setTheme('brutal')}
        />
        <ThemeOption
          active={theme === 'glass'}
          label={t.themeGlass}
          preview="glass"
          onClick={() => setTheme('glass')}
        />
        <ThemeOption
          active={theme === 'neomorph'}
          label={t.themeNeomorph}
          preview="neomorph"
          onClick={() => setTheme('neomorph')}
        />
        <ThemeOption
          active={theme === 'candy'}
          label={t.themeCandy}
          preview="candy"
          onClick={() => setTheme('candy')}
        />
      </div>
    </div>
  );
}

function ThemeOption({
  active,
  label,
  preview,
  onClick,
}: {
  active: boolean;
  label: string;
  preview: 'brutal' | 'glass' | 'neomorph' | 'candy';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl p-2 text-left transition',
        active ? 'ring-2 ring-blue-400/70' : 'ring-1 ring-white/10 hover:ring-white/25'
      )}
    >
      <div
        className={cn(
          'mb-2 h-12 rounded-lg',
          preview === 'brutal'
            ? 'theme-preview-brutal'
            : preview === 'glass'
              ? 'theme-preview-glass'
              : preview === 'neomorph'
                ? 'theme-preview-neomorph'
                : 'theme-preview-candy'
        )}
      />
      <span className="block text-[11px] font-semibold text-white/80">{label}</span>
    </button>
  );
}
