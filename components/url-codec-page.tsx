'use client';

import { useState } from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell, useAppChrome } from '@/components/app-shell';
import { Button } from '@/components/ui/button';

export function UrlCodecPage() {
  return (
    <AppShell contentClassName="max-w-4xl">
      <UrlCodecContent />
    </AppShell>
  );
}

function UrlCodecContent() {
  const { t, locale } = useAppChrome();
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleEncode = () => {
    setError('');
    setOutputValue(encodeURIComponent(inputValue));
  };

  const handleDecode = () => {
    try {
      const decoded = decodeURIComponent(inputValue);
      setOutputValue(decoded);
      setError('');
    } catch {
      setError(t.urlCodecInvalid);
      setOutputValue('');
    }
  };

  const handleCopyResult = async () => {
    if (!outputValue) return;
    try {
      await navigator.clipboard.writeText(outputValue);
      setCopied(true);
      toast.success(locale === 'id' ? 'Hasil berhasil disalin!' : 'Result copied to clipboard!');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(locale === 'id' ? 'Gagal menyalin' : 'Failed to copy');
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Code2 className="h-5 w-5 text-blue-300" />
          <h1 className="text-2xl font-semibold">{t.urlCodecTitle}</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">{t.urlCodecSubtitle}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          {t.urlCodecInputLabel}
        </label>
        <textarea
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={t.urlCodecInputPlaceholder}
          className="w-full min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleEncode}>{t.urlCodecEncode}</Button>
          <Button variant="secondary" onClick={handleDecode}>
            {t.urlCodecDecode}
          </Button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t.urlCodecResultLabel}
          </p>
          {outputValue && (
            <button
              type="button"
              onClick={handleCopyResult}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm transition"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? (locale === 'id' ? 'Tersalin!' : 'Copied!') : (locale === 'id' ? 'Salin Hasil' : 'Copy Result')}</span>
            </button>
          )}
        </div>
        <textarea
          value={outputValue}
          readOnly
          className="w-full min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </div>
    </div>
  );
}
