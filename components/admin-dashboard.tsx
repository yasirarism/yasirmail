'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  Copy,
  Loader2,
  Palette,
  Plus,
  ShieldCheck,
  ShieldOff,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { DEFAULT_APP_NAME } from '@/lib/branding';
import { applyTheme, DEFAULT_THEME, isVisualTheme, type VisualTheme } from '@/lib/theme';

type TelegramSettings = {
  enabled: boolean;
  botToken: string;
  chatId: string;
  allowedDomains?: string[];
};

type RetentionSettings = {
  seconds: number;
};

type BrandingSettings = {
  appName: string;
  headerTitle?: string;
  headerDescription?: string;
  announcement?: string;
};

type HomepageLockSettings = {
  enabled: boolean;
  hasPassword: boolean;
  updatedAt?: string;
};

type DomainsSettings = {
  domains: string[];
};

type ImapSettings = {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  rejectUnauthorized: boolean;
  maxFetch: number;
};

type ThemeSettings = {
  defaultTheme: VisualTheme;
  updatedAt?: string;
};

const THEME_OPTIONS: { value: VisualTheme; label: string; preview: string; desc: string }[] = [
  { value: 'brutal', label: 'Neo Brutal', preview: 'theme-preview-brutal', desc: 'RuangMail style (light)' },
  { value: 'glass', label: 'Glassmorphism', preview: 'theme-preview-glass', desc: 'Glassmorphism + blur' },
  { value: 'neomorph', label: 'Neomorph', preview: 'theme-preview-neomorph', desc: 'Soft UI neomorph' },
  { value: 'candy', label: 'Candy Aurora', preview: 'theme-preview-candy', desc: 'Soft pastel + aurora glow' }
];

const normalizeThemeSetting = (value: unknown): VisualTheme =>
  typeof value === 'string' && isVisualTheme(value) ? value : DEFAULT_THEME;

type AdminStats = {
  inboxCount: number;
  messageCount: number;
  latestReceivedAt: string | null;
};

const normalizeDomains = (domains: string[]) =>
  [...new Set(domains.map((domain) => domain.toLowerCase().trim()).filter(Boolean))];

export function AdminDashboard() {
  const [enabled, setEnabled] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [retentionSeconds, setRetentionSeconds] = useState(86400);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retentionSaving, setRetentionSaving] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [domainsSaving, setDomainsSaving] = useState(false);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [headerTitle, setHeaderTitle] = useState('Temp Mail');
  const [headerDescription, setHeaderDescription] = useState('Spin up secure temporary inboxes in seconds. Bring your own domain or use the default.');
  const [announcement, setAnnouncement] = useState('');
  const [homepageLockEnabled, setHomepageLockEnabled] = useState(false);
  const [homepageLockPassword, setHomepageLockPassword] = useState('');
  const [homepageLockSaving, setHomepageLockSaving] = useState(false);
  const [homepageLockHasPassword, setHomepageLockHasPassword] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);
  const [maintenanceAddress, setMaintenanceAddress] = useState('');
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [deleteInboxRunning, setDeleteInboxRunning] = useState(false);
  const [deleteAllRunning, setDeleteAllRunning] = useState(false);
  const [imapSettings, setImapSettings] = useState<ImapSettings>({ enabled: false, host: '', port: 993, user: '', password: '', tls: true, rejectUnauthorized: true, maxFetch: 30 });
  const [imapSaving, setImapSaving] = useState(false);
  const [imapTesting, setImapTesting] = useState(false);
  const [imapSupported, setImapSupported] = useState(true);
  const [defaultTheme, setDefaultTheme] = useState<VisualTheme>(DEFAULT_THEME);
  const [themeSaving, setThemeSaving] = useState(false);
  const [storageDriver, setStorageDriver] = useState<'d1' | 'mongo' | 'unknown'>('unknown');
  const [apiClientId, setApiClientId] = useState('');
  const [apiClientSecret, setApiClientSecret] = useState('');
  const [apiAppUrl, setApiAppUrl] = useState('');
  const [apiRequireKey, setApiRequireKey] = useState(false);
  const [apiSaving, setApiSaving] = useState(false);

  const retentionOptions = useMemo(
    () => [
      { label: '30 menit', value: 1800 },
      { label: '1 jam', value: 3600 },
      { label: '24 jam', value: 86400 },
      { label: '3 hari', value: 259200 },
      { label: '1 minggu', value: 604800 }
    ],
    []
  );

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [
        telegramResponse,
        retentionResponse,
        brandingResponse,
        domainsResponse,
        homepageLockResponse,
        imapResponse,
        themeResponse,
        runtimeResponse,
        apiResponse
      ] = await Promise.all([
        fetch('/api/admin/telegram'),
        fetch('/api/admin/retention'),
        fetch('/api/admin/branding'),
        fetch('/api/admin/domains'),
        fetch('/api/admin/homepage-lock'),
        fetch('/api/admin/imap'),
        fetch('/api/admin/theme'),
        fetch('/api/runtime'),
        fetch('/api/admin/api-settings')
      ]);
      if (
        !telegramResponse.ok ||
        !retentionResponse.ok ||
        !brandingResponse.ok ||
        !domainsResponse.ok ||
        !homepageLockResponse.ok ||
        !imapResponse.ok ||
        !themeResponse.ok
      ) {
        throw new Error('Unauthorized or failed to load settings.');
      }
      const data = (await telegramResponse.json()) as TelegramSettings;
      const retentionData =
        (await retentionResponse.json()) as RetentionSettings;
      const brandingData = (await brandingResponse.json()) as BrandingSettings;
      const domainsData = (await domainsResponse.json()) as DomainsSettings;
      const homepageLockData =
        (await homepageLockResponse.json()) as HomepageLockSettings;
      const imapData = (await imapResponse.json()) as ImapSettings & { supported?: boolean };
      const themeData = (await themeResponse.json()) as ThemeSettings;
      setDefaultTheme(normalizeThemeSetting(themeData?.defaultTheme));
      if (apiResponse.ok) {
        const apiData = (await apiResponse.json()) as {
          githubClientId?: string;
          githubClientSecret?: string;
          appUrl?: string;
          requireApiKey?: boolean;
        };
        setApiClientId(apiData.githubClientId || '');
        setApiClientSecret(apiData.githubClientSecret || '');
        setApiAppUrl(apiData.appUrl || '');
        setApiRequireKey(Boolean(apiData.requireApiKey));
      }
      if (runtimeResponse.ok) {
        const runtime = (await runtimeResponse.json()) as {
          storageDriver?: 'd1' | 'mongo';
          imapSupported?: boolean;
        };
        if (runtime.storageDriver === 'd1' || runtime.storageDriver === 'mongo') {
          setStorageDriver(runtime.storageDriver);
        }
        if (typeof runtime.imapSupported === 'boolean') {
          setImapSupported(runtime.imapSupported);
        }
      } else if (typeof imapData.supported === 'boolean') {
        setImapSupported(imapData.supported);
      }
      setEnabled(Boolean(data.enabled));
      setBotToken(data.botToken || '');
      setChatId(data.chatId || '');
      const incomingAvailable = normalizeDomains(domainsData?.domains || []);
      const incomingAllowed = normalizeDomains(
        Array.isArray(data.allowedDomains) ? data.allowedDomains : []
      );
      setAvailableDomains(incomingAvailable);
      setAllowedDomains(
        incomingAllowed.length > 0 ? incomingAllowed : incomingAvailable
      );
      if (retentionData?.seconds) {
        setRetentionSeconds(retentionData.seconds);
      }
      if (brandingData?.appName) setAppName(brandingData.appName);
      if (brandingData?.headerTitle) setHeaderTitle(brandingData.headerTitle);
      if (brandingData?.headerDescription) setHeaderDescription(brandingData.headerDescription);
      if (typeof brandingData?.announcement === 'string') setAnnouncement(brandingData.announcement);
      setHomepageLockEnabled(Boolean(homepageLockData?.enabled));
      setHomepageLockHasPassword(Boolean(homepageLockData?.hasPassword));
      setImapSettings({ ...imapSettings, ...imapData });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load admin settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Unauthorized or failed to load stats.');
      }
      const data = (await response.json()) as AdminStats;
      setStats(data);
    } catch (error) {
      console.error(error);
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const filteredAllowed = allowedDomains.filter((domain) =>
        availableDomains.includes(domain)
      );
      const response = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled,
          botToken,
          chatId,
          allowedDomains: filteredAllowed
        })
      });
      if (!response.ok) {
        throw new Error('Unauthorized or failed to save settings.');
      }
      setAllowedDomains(filteredAllowed);
      toast.success('Telegram settings saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save Telegram settings.');
    } finally {
      setSaving(false);
    }
  };

  const saveRetention = async (value: number) => {
    setRetentionSeconds(value);
    setRetentionSaving(true);
    try {
      const response = await fetch('/api/admin/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: value })
      });
      if (!response.ok) {
        throw new Error('Unauthorized or failed to save retention.');
      }
      toast.success('Retention settings saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save retention settings.');
    } finally {
      setRetentionSaving(false);
    }
  };

  const saveBranding = async () => {
    setBrandingSaving(true);
    try {
      const response = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, headerTitle, headerDescription, announcement })
      });
      if (!response.ok) {
        throw new Error('Unauthorized or failed to save branding.');
      }
      toast.success('Site name saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save site name.');
    } finally {
      setBrandingSaving(false);
    }
  };

  const saveApiSettings = async () => {
    setApiSaving(true);
    try {
      const response = await fetch('/api/admin/api-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubClientId: apiClientId,
          githubClientSecret: apiClientSecret,
          appUrl: apiAppUrl,
          requireApiKey: apiRequireKey
        })
      });
      if (!response.ok) {
        throw new Error('Unauthorized or failed to save API settings.');
      }
      toast.success('API / GitHub settings saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save API settings.');
    } finally {
      setApiSaving(false);
    }
  };

  const selectTheme = (next: VisualTheme) => {
    setDefaultTheme(next);
    // Live preview only (does not touch the personal localStorage override).
    applyTheme(next);
  };

  const saveTheme = async () => {
    setThemeSaving(true);
    try {
      const response = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultTheme })
      });
      if (!response.ok) {
        throw new Error('Unauthorized or failed to save theme.');
      }
      const data = (await response.json()) as ThemeSettings;
      setDefaultTheme(normalizeThemeSetting(data?.defaultTheme));
      toast.success('Theme saved. Berlaku sebagai tema default untuk semua pengunjung baru.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save theme.');
    } finally {
      setThemeSaving(false);
    }
  };

  const saveHomepageLock = async () => {
    if (homepageLockEnabled && !homepageLockPassword.trim() && !homepageLockHasPassword) {
      toast.error('Masukkan password untuk mengaktifkan homepage lock.');
      return;
    }
    setHomepageLockSaving(true);
    try {
      const response = await fetch('/api/admin/homepage-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: homepageLockEnabled,
          password: homepageLockPassword || undefined
        })
      });
      if (!response.ok) {
        throw new Error('Unauthorized or failed to save homepage lock.');
      }
      const data = (await response.json()) as HomepageLockSettings;
      setHomepageLockEnabled(Boolean(data.enabled));
      setHomepageLockHasPassword(Boolean(data.hasPassword));
      setHomepageLockPassword('');
      toast.success('Homepage lock saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save homepage lock.');
    } finally {
      setHomepageLockSaving(false);
    }
  };



  const saveImapSettings = async () => {
    setImapSaving(true);
    try {
      const response = await fetch('/api/admin/imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imapSettings)
      });
      if (!response.ok) throw new Error('Unauthorized or failed to save IMAP settings.');
      const data = (await response.json()) as ImapSettings;
      setImapSettings((prev) => ({ ...prev, ...data }));
      toast.success('IMAP settings saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save IMAP settings.');
    } finally {
      setImapSaving(false);
    }
  };


  const testImapSettings = async () => {
    setImapTesting(true);
    try {
      const response = await fetch('/api/admin/imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...imapSettings, action: 'test' })
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'IMAP test failed');
      }
      toast.success('IMAP test berhasil. Koneksi valid.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? `IMAP test gagal: ${error.message}` : 'IMAP test gagal.');
    } finally {
      setImapTesting(false);
    }
  };

  const saveDomains = async (
    nextDomains: string[],
    successMessage = 'Domains saved.'
  ) => {
    setDomainsSaving(true);
    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: nextDomains })
      });
      if (!response.ok) {
        throw new Error('Unauthorized or failed to save domains.');
      }
      const data = (await response.json()) as DomainsSettings;
      const normalized = normalizeDomains(data.domains || []);
      setAvailableDomains(normalized);
      setAllowedDomains((prev) =>
        prev.filter((domain) => normalized.includes(domain))
      );
      toast.success(successMessage);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save domains.');
    } finally {
      setDomainsSaving(false);
    }
  };

  const handleAddDomain = async () => {
    const domain = newDomain.toLowerCase().trim();
    if (!domain || availableDomains.includes(domain)) return;
    const nextDomains = normalizeDomains([...availableDomains, domain]);
    setNewDomain('');
    setAvailableDomains(nextDomains);
    setAllowedDomains((prev) => normalizeDomains([...prev, domain]));
    await saveDomains(nextDomains, 'Domain added.');
  };

  const handleRemoveDomain = (domain: string) => {
    setDomainToDelete(domain);
  };

  const confirmRemoveDomain = async () => {
    if (!domainToDelete) return;
    const domain = domainToDelete;
    const nextDomains = availableDomains.filter((item) => item !== domain);
    setAvailableDomains(nextDomains);
    setAllowedDomains((prev) => prev.filter((item) => item !== domain));
    setDomainToDelete(null);
    await saveDomains(nextDomains, 'Domain deleted.');
  };

  const cancelRemoveDomain = () => {
    setDomainToDelete(null);
  };

  const handleCopyDomain = async (domain: string) => {
    try {
      await navigator.clipboard.writeText(domain);
      toast.success('Domain copied to clipboard.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to copy domain.');
    }
  };

  const runCleanup = async () => {
    setCleanupRunning(true);
    try {
      const response = await fetch('/api/admin/inbox-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      });
      if (!response.ok) {
        throw new Error('Failed to run cleanup');
      }
      const data = (await response.json()) as { deleted?: number };
      toast.success(`Cleanup selesai. ${data.deleted || 0} pesan dihapus.`);
      fetchStats();
    } catch (error) {
      console.error(error);
      toast.error('Cleanup inbox gagal dijalankan.');
    } finally {
      setCleanupRunning(false);
    }
  };

  const deleteInboxMessages = async () => {
    const address = maintenanceAddress.trim().toLowerCase();
    if (!address) {
      toast.error('Masukkan alamat inbox yang mau dihapus.');
      return;
    }
    setDeleteInboxRunning(true);
    try {
      const response = await fetch('/api/admin/inbox-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-inbox', address })
      });
      if (!response.ok) {
        throw new Error('Failed to delete inbox');
      }
      const data = (await response.json()) as { deleted?: number };
      toast.success(`Inbox ${address} dihapus (${data.deleted || 0} pesan).`);
      fetchStats();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus pesan inbox.');
    } finally {
      setDeleteInboxRunning(false);
    }
  };

  const deleteAllMessages = async () => {
    setDeleteAllRunning(true);
    try {
      const response = await fetch('/api/admin/inbox-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-all' })
      });
      if (!response.ok) {
        throw new Error('Failed to delete all inbox');
      }
      const data = (await response.json()) as { deleted?: number };
      toast.success(`Semua inbox dihapus (${data.deleted || 0} pesan).`);
      fetchStats();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus semua inbox.');
    } finally {
      setDeleteAllRunning(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const latestActivityLabel = useMemo(() => {
    if (statsLoading && !stats) {
      return 'Memuat...';
    }
    if (statsError) {
      return 'Gagal memuat';
    }
    if (!stats?.latestReceivedAt) {
      return 'Belum ada email';
    }
    return formatDistanceToNow(new Date(stats.latestReceivedAt), {
      addSuffix: true
    });
  }, [stats, statsError, statsLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/60 text-white">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-8 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200/70">
                Admin Dashboard
              </p>
              <h1 className="text-3xl font-semibold text-white">
                {headerTitle || "Temp Mail"}
              </h1>
              <p className="text-sm text-white/70">
                {headerDescription || 'Spin up secure temporary inboxes in seconds. Bring your own domain or use the default.'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-8 grid gap-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                    Statistik Real-time
                  </p>
                  <h2 className="text-lg font-semibold text-white">
                    Aktivitas Inbox
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Inbox Aktif
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {stats?.inboxCount ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Total Pesan
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {stats?.messageCount ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Terakhir Masuk
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {latestActivityLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Cleanup & Delete Inbox
                  </h2>
                  <p className="text-sm text-white/60">
                    Jalankan cleanup manual kalau auto-delete belum menghapus pesan lama.
                  </p>
                </div>
                <Button onClick={runCleanup} disabled={cleanupRunning}>
                  {cleanupRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Jalankan Cleanup'
                  )}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  value={maintenanceAddress}
                  onChange={(event) => setMaintenanceAddress(event.target.value)}
                  placeholder="email@domain.com"
                  className="bg-black/30 text-white placeholder:text-white/40"
                />
                <Button
                  type="button"
                  onClick={deleteInboxMessages}
                  disabled={deleteInboxRunning || !maintenanceAddress.trim()}
                  className="bg-red-500/80 text-white hover:bg-red-500"
                >
                  {deleteInboxRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete Inbox'
                  )}
                </Button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={deleteAllMessages}
                  disabled={deleteAllRunning}
                  className="border border-red-300/30 text-red-200 hover:bg-red-500/10"
                >
                  {deleteAllRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Semua Pesan
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Nama Website
                  </h2>
                  <p className="text-sm text-white/60">
                    Nama ini akan tampil di header dan footer.
                  </p>
                </div>
                <Button onClick={saveBranding} disabled={brandingSaving}>
                  {brandingSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Simpan Nama'
                  )}
                </Button>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/60">Nama Web</label>
                <Input
                  value={appName}
                  onChange={(event) => setAppName(event.target.value)}
                  placeholder={DEFAULT_APP_NAME}
                  className="mt-3 bg-black/30 text-white placeholder:text-white/40"
                />
                <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-white/60">Title bawah header (opsional)</label>
                <Input
                  value={headerTitle}
                  onChange={(event) => setHeaderTitle(event.target.value)}
                  placeholder="Temp Mail"
                  className="mt-3 bg-black/30 text-white placeholder:text-white/40"
                />
                <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-white/60">Deskripsi bawah header (opsional)</label>
                <Input
                  value={headerDescription}
                  onChange={(event) => setHeaderDescription(event.target.value)}
                  placeholder="Spin up secure temporary inboxes in seconds..."
                  className="mt-3 bg-black/30 text-white placeholder:text-white/40"
                />
                <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-white/60">Pengumuman (opsional, tampil di ticker navbar)</label>
                <Input
                  value={announcement}
                  onChange={(event) => setAnnouncement(event.target.value)}
                  placeholder="Pengumuman gratis untuk pengguna..."
                  className="mt-3 bg-black/30 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Palette className="h-5 w-5 text-blue-300" />
                    Tema Tampilan
                  </h2>
                  <p className="text-sm text-white/60">
                    Pilih tema default untuk seluruh website. Pengunjung tetap bisa
                    memilih tema sendiri lewat menu pengaturan.
                  </p>
                </div>
                <Button onClick={saveTheme} disabled={themeSaving}>
                  {themeSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Simpan Tema'
                  )}
                </Button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {THEME_OPTIONS.map((option) => {
                  const active = defaultTheme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectTheme(option.value)}
                      className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all ${
                        active
                          ? 'border-blue-400/60 bg-blue-400/10'
                          : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className={`h-12 w-16 shrink-0 rounded-lg ${option.preview}`} />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-white">
                          {option.label}
                        </span>
                        <span className="block text-xs text-white/50">
                          {option.desc}
                        </span>
                      </span>
                      {active && (
                        <span className="rounded-full bg-blue-400/20 px-2 py-1 text-[10px] font-semibold text-blue-200">
                          AKTIF
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-white/50">
                Tema langsung dipratinjau saat dipilih. Simpan untuk menerapkan ke semua
                pengunjung yang belum memilih tema sendiri.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Homepage Private
                  </h2>
                  <p className="text-sm text-white/60">
                    Kunci homepage dengan password agar hanya yang punya akses
                    bisa membuka website.
                  </p>
                </div>
                <Button
                  variant={homepageLockEnabled ? 'default' : 'secondary'}
                  onClick={() => setHomepageLockEnabled((prev) => !prev)}
                >
                  {homepageLockEnabled ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Nonaktif
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Password Homepage
                  </label>
                  <Input
                    type="password"
                    value={homepageLockPassword}
                    onChange={(event) => setHomepageLockPassword(event.target.value)}
                    placeholder="Masukkan password baru"
                    className="mt-3 bg-black/30 text-white placeholder:text-white/40"
                  />
                  <p className="mt-2 text-xs text-white/50">
                    Kosongkan jika tidak ingin mengganti password.
                  </p>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button
                    onClick={saveHomepageLock}
                    disabled={homepageLockSaving}
                  >
                    {homepageLockSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Simpan Homepage Lock'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Manajemen Domain
                  </h2>
                  <p className="text-sm text-white/60">
                    Tambahkan domain yang tersedia di aplikasi.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  Tambah Domain
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input
                    value={newDomain}
                    onChange={(event) => setNewDomain(event.target.value)}
                    placeholder="contoh.com"
                    className="h-9 flex-1 bg-black/30 text-white placeholder:text-white/40"
                  />
                  <Button
                    type="button"
                    onClick={handleAddDomain}
                    disabled={domainsSaving || !newDomain.trim()}
                  >
                    {domainsSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {availableDomains.length === 0 ? (
                    <p className="text-sm text-white/50">
                      Belum ada domain tersimpan.
                    </p>
                  ) : (
                    availableDomains.map((domain) => (
                      <div
                        key={domain}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80"
                      >
                        <span className="font-mono">{domain}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyDomain(domain)}
                            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDomain(domain)}
                            className="h-7 w-7 text-white/60 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ===== API & INTEGRATIONS ===== */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">API & Integrations</h2>
              <p className="mt-1 text-sm text-white/60">
                Konfigurasi GitHub OAuth untuk API key generation. Panduan:
              </p>
              <ol className="mt-3 list-inside list-decimal space-y-1.5 text-xs text-white/70">
                <li>Buka <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">GitHub OAuth Apps</a> → New OAuth App</li>
                <li>Homepage URL: <code className="block w-full break-all rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">{apiAppUrl || window.location.origin}</code></li>
                <li>Callback URL: <code className="block w-full break-all rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">{apiAppUrl || window.location.origin}/api/auth/github/callback</code></li>
                <li>Generate Client Secret, lalu isi di bawah</li>
              </ol>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/60">GitHub Client ID</label>
                  <Input value={apiClientId} onChange={(e) => setApiClientId(e.target.value)} placeholder="Iv1.xxxxxxxxxxxx" className="mt-3 bg-black/30 text-white placeholder:text-white/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/60">GitHub Client Secret</label>
                  <Input value={apiClientSecret} onChange={(e) => setApiClientSecret(e.target.value)} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" type="password" className="mt-3 bg-black/30 text-white placeholder:text-white/40" />
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/60">APP URL (kosongkan untuk auto-detect)</label>
                  <Input value={apiAppUrl} onChange={(e) => setApiAppUrl(e.target.value)} placeholder="https://domainkamu.com" className="mt-3 bg-black/30 text-white placeholder:text-white/40" />
                  <p className="mt-1 text-[11px] text-white/50">Default: {window.location.origin}</p>
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60">REQUIRE_API_KEY</span>
                    <Button variant={apiRequireKey ? 'default' : 'secondary'} onClick={() => setApiRequireKey((prev) => !prev)}>
                      {apiRequireKey ? 'Aktif' : 'Nonaktif'}
                    </Button>
                    {apiRequireKey && <span className="text-[11px] text-yellow-400">⚠️ Wajib session/login</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Button onClick={saveApiSettings} disabled={apiSaving}>
                  {apiSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Simpan API Settings
                </Button>
                <a href="/api-access" className="text-xs text-blue-400 underline">Lihat API Docs</a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Status Notifikasi
                  </h2>
                  <p className="text-sm text-white/60">
                    Aktifkan untuk mengirim notifikasi ke Telegram.
                  </p>
                </div>
                <Button
                  variant={enabled ? 'default' : 'secondary'}
                  onClick={() => setEnabled((prev) => !prev)}
                >
                  {enabled ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Nonaktif
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Bot Token
                  </label>
                  <Input
                    value={botToken}
                    onChange={(event) => setBotToken(event.target.value)}
                    placeholder="123456:ABCDEF..."
                    className="mt-3 bg-black/30 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Chat ID / Channel ID
                  </label>
                  <Input
                    value={chatId}
                    onChange={(event) => setChatId(event.target.value)}
                    placeholder="-100xxxxxxxxxx"
                    className="mt-3 bg-black/30 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                  Domain yang dikirim ke Telegram
                </p>
                <p className="mt-2 text-xs text-white/50">
                  Pilih domain yang akan dikirim ke Telegram.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {availableDomains.length === 0 ? (
                    <p className="text-sm text-white/50">
                      Tambahkan domain terlebih dahulu.
                    </p>
                  ) : (
                    availableDomains.map((domain) => {
                      const checked = allowedDomains.includes(domain);
                      return (
                        <label
                          key={domain}
                          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-purple-400"
                            checked={checked}
                            onChange={() => {
                              setAllowedDomains((prev) =>
                                checked
                                  ? prev.filter((item) => item !== domain)
                                  : [...prev, domain]
                              );
                            }}
                          />
                          <span className="font-mono">{domain}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-white/50">
                Pastikan bot sudah ditambahkan sebagai admin di channel.
              </p>
            </div>


            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">IMAP Fetch</h2>
                  <p className="text-sm text-white/60">
                    {imapSupported
                      ? 'Ambil email langsung dari IMAP seperti TMAIL, terbatas pada durasi retensi inbox.'
                      : 'IMAP dimatikan di Cloudflare karena delay dan tidak ada TCP socket. Pakai Email Routing + webhook.'}
                  </p>
                  {storageDriver !== 'unknown' && (
                    <p className="mt-1 text-xs text-white/40">
                      Storage: {storageDriver === 'd1' ? 'Cloudflare D1' : 'MongoDB'}
                    </p>
                  )}
                </div>
                {imapSupported && (
                  <Button variant={imapSettings.enabled ? 'default' : 'secondary'} onClick={() => setImapSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}>
                    {imapSettings.enabled ? 'Aktif' : 'Nonaktif'}
                  </Button>
                )}
              </div>
              {imapSupported ? (
                <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Input value={imapSettings.host} onChange={(e) => setImapSettings((p) => ({ ...p, host: e.target.value }))} placeholder="imap.gmail.com" className="bg-black/30 text-white placeholder:text-white/40" />
                <Input value={String(imapSettings.port)} onChange={(e) => setImapSettings((p) => ({ ...p, port: Number(e.target.value || 993) }))} placeholder="993" className="bg-black/30 text-white placeholder:text-white/40" />
                <Input value={imapSettings.user} onChange={(e) => setImapSettings((p) => ({ ...p, user: e.target.value }))} placeholder="gmail@domain.com" className="bg-black/30 text-white placeholder:text-white/40" />
                <Input type="password" value={imapSettings.password} onChange={(e) => setImapSettings((p) => ({ ...p, password: e.target.value }))} placeholder="App Password" className="bg-black/30 text-white placeholder:text-white/40" />
                <Input value={String(imapSettings.maxFetch)} onChange={(e) => setImapSettings((p) => ({ ...p, maxFetch: Number(e.target.value || 30) }))} placeholder="30" className="bg-black/30 text-white placeholder:text-white/40" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={testImapSettings} disabled={imapTesting || imapSaving}>
                  {imapTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test IMAP'}
                </Button>
                <Button onClick={saveImapSettings} disabled={imapSaving}>
                  {imapSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan IMAP'}
                </Button>
              </div>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Deploy Cloudflare memakai D1 + webhook. Set <span className="font-mono">WEBHOOK_URL</span> worker email ke <span className="font-mono">/api/webhook</span>.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Retensi Global Inbox
                  </h2>
                  <p className="text-sm text-white/60">
                    Semua inbox mengikuti durasi ini.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Clock className="h-4 w-4" />
                  {retentionOptions.find((option) => option.value === retentionSeconds)
                    ?.label || '24 jam'}
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {retentionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => saveRetention(option.value)}
                    disabled={retentionSaving}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                      retentionSeconds === option.value
                        ? 'border-purple-500/50 bg-purple-500/10 text-white'
                        : 'border-white/5 bg-white/[0.02] text-white/70 hover:border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    {retentionSeconds === option.value && (
                      <span className="rounded-full bg-purple-500/20 px-2 py-1 text-[10px] font-semibold text-purple-200">
                        AKTIF
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving || loading}>
                {saving || loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {domainToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={cancelRemoveDomain}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-background p-6 text-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Delete domain</h3>
            <p className="mt-2 text-sm text-white/70">
              Are you sure you want to delete domain{' '}
              <span className="font-mono text-white">{domainToDelete}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={cancelRemoveDomain}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmRemoveDomain}
                className="bg-red-500/80 text-white hover:bg-red-500"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
