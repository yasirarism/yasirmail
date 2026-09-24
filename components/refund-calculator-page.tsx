'use client';

import { useState } from 'react';
import { CalendarClock, Coins } from 'lucide-react';

import { AppShell, useAppChrome } from '@/components/app-shell';
import { Input } from '@/components/ui/input';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function RefundCalculatorPage() {
  return (
    <AppShell>
      <RefundCalculatorContent />
    </AppShell>
  );
}

function RefundCalculatorContent() {
  const { t } = useAppChrome();
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [totalDays, setTotalDays] = useState('30');
  const [refundRate, setRefundRate] = useState(0.7);

  const priceValue = Math.max(Number(purchasePrice) || 0, 0);
  const totalValue = Math.max(Number(totalDays) || 0, 0);
  const resolvedPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
  const resolvedIssueDate = issueDate ? new Date(issueDate) : null;
  const elapsedDays =
    resolvedPurchaseDate && resolvedIssueDate
      ? Math.max(
          0,
          Math.ceil(
            (resolvedIssueDate.getTime() - resolvedPurchaseDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;
  const remainingValue = clamp(totalValue - elapsedDays, 0, totalValue || 0);
  const rateValue = clamp(refundRate, 0.5, 1);
  const usageRatio = totalValue > 0 ? remainingValue / totalValue : 0;
  const refundAmount = priceValue * usageRatio * rateValue;
  const refundPercentage = priceValue > 0 ? (refundAmount / priceValue) * 100 : 0;
  const retainedAmount = Math.max(priceValue - refundAmount, 0);
  const formatCurrency = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Coins className="h-5 w-5 text-emerald-300" />
          <h1 className="text-2xl font-semibold">{t.refundTitle}</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">{t.refundSubtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t.refundPurchaseLabel}
          </label>
          <Input
            value={purchasePrice}
            onChange={(event) => setPurchasePrice(event.target.value)}
            type="number"
            min="0"
            className="bg-black/40 border-white/10 text-sm"
            placeholder="0"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t.refundPurchaseDateLabel}
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t.refundIssueDateLabel}
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={(event) => setIssueDate(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t.refundTotalLabel}
          </label>
          <Input
            value={totalDays}
            onChange={(event) => setTotalDays(event.target.value)}
            type="number"
            min="1"
            className="bg-black/40 border-white/10 text-sm"
            placeholder="30"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <label className="font-semibold uppercase tracking-[0.2em] text-white/50">
              {t.refundRateLabel}
            </label>
            <span>{rateValue.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={refundRate}
            onChange={(event) => setRefundRate(Number(event.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span>0.50</span>
            <span>1.00</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-4">
        <div className="flex items-center justify-between text-sm text-white/80">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-blue-200" />
            <span>{t.refundPreviewTitle}</span>
          </div>
          <span>{t.refundPreviewRate.replace('{rate}', `${rateValue.toFixed(2)}`)}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className="refund-chart-track h-32 w-32 rounded-full border border-white/10 bg-white/5 flex items-center justify-center transition-all duration-300"
              style={{
                background: `conic-gradient(#10b981 ${refundPercentage}%, rgba(167, 139, 250, 0.22) 0)`,
              }}
            >
              <div className="refund-chart-hole h-24 w-24 rounded-full bg-slate-950/80 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-white/60">{t.refundRefundLabel}</span>
                <span className="text-lg font-semibold text-white">
                  {refundPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-white/60">
              {t.refundRemainingDays.replace('{days}', `${remainingValue}`)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span>{t.refundAmountLabel}</span>
              <span>{formatCurrency.format(refundAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-white/60 text-xs">
              <span>{t.refundRetainedLabel}</span>
              <span>{formatCurrency.format(retainedAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-white/60 text-xs">
              <span>{t.refundElapsedLabel}</span>
              <span>{elapsedDays}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
