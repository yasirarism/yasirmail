'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, MailPlus } from 'lucide-react';

import { AppShell, useAppChrome } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MAX_VARIANTS = 128;

const normalizeLocalPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/@gmail\.com|@googlemail\.com/gi, '')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]/g, '');

const buildVariants = (localPart: string) => {
  if (localPart.length <= 1) return [localPart];
  const positions = localPart.length - 1;
  const total = 2 ** positions;
  const variants: string[] = [];
  for (let mask = 0; mask < total; mask += 1) {
    let result = '';
    for (let i = 0; i < localPart.length; i += 1) {
      result += localPart[i];
      if (i < localPart.length - 1 && (mask & (1 << i))) {
        result += '.';
      }
    }
    variants.push(result);
    if (variants.length >= MAX_VARIANTS) break;
  }
  return variants;
};

export function GmailDotPage() {
  return (
    <AppShell>
      <GmailDotContent />
    </AppShell>
  );
}

function GmailDotContent() {
  const { t, locale } = useAppChrome();
  const [inputValue, setInputValue] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const localPart = useMemo(() => normalizeLocalPart(inputValue), [inputValue]);
  const variants = useMemo(() => buildVariants(localPart), [localPart]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(value);
      window.setTimeout(() => setCopyStatus(null), 1200);
    } catch {
      setCopyStatus(null);
    }
  };

  const handleCopyAll = async () => {
    if (!variants.length) return;
    try {
      const allText = variants.map((v) => `${v}@gmail.com`).join('\n');
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      setCopiedAll(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <MailPlus className="h-5 w-5 text-blue-300" />
          <h1 className="text-2xl font-semibold">{t.gmailDotTitle}</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">{t.gmailDotSubtitle}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          {t.gmailDotInputLabel}
        </label>
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={t.gmailDotInputPlaceholder}
          className="bg-black/40 border-white/10 text-sm"
        />
        <p className="text-xs text-white/60">
          {t.gmailDotHint.replace('{count}', `${variants.length}`)}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t.gmailDotResultsLabel} {localPart ? `(${variants.length})` : ''}
          </p>
          {localPart && variants.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm transition"
            >
              {copiedAll ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedAll ? (locale === 'id' ? 'Semua Tersalin!' : 'All Copied!') : (locale === 'id' ? 'Salin Semua' : 'Copy All')}</span>
            </button>
          )}
        </div>
        {localPart ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {variants.map((variant) => {
              const full = `${variant}@gmail.com`;
              const isCopied = copyStatus === full;
              return (
                <div
                  key={full}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 min-w-0"
                >
                  <span className="font-mono text-xs text-white/80 truncate flex-1 min-w-0">{full}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(full)}
                    className={cn(
                      'shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all',
                      isCopied
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                    )}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{isCopied ? (locale === 'id' ? 'Tersalin' : t.gmailDotCopied) : t.gmailDotCopy}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-white/50">{t.gmailDotEmpty}</p>
        )}
      </div>
    </div>
  );
}
