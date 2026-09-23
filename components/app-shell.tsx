'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { Code2, Mail, Menu, Shield, Sun, Moon, Sparkles, Wrench, Github } from 'lucide-react';

import { ThemePicker } from '@/components/theme-picker';
import { Starfield } from '@/components/starfield';
import { cn } from '@/lib/utils';
import {
  DEFAULT_LOCALE,
  getTranslations,
  SUPPORTED_LOCALES,
  type Locale,
  type Translations,
} from '@/lib/i18n';
import { DEFAULT_APP_NAME } from '@/lib/branding';
import { useVisualTheme } from '@/components/theme-provider';
import { VISUAL_THEMES } from '@/lib/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { getBrandingSettings } from '@/app/actions/email';

const STORAGE_KEY = 'vaultmail_locale';
const LOCALE_EVENT = 'vaultmail-locale-change';

const isLocale = (value: string | null): value is Locale =>
  Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));

const readStoredLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Ignore unavailable storage, e.g. privacy mode.
  }
  return DEFAULT_LOCALE;
};

const subscribeLocale = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(LOCALE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(LOCALE_EVENT, onStoreChange);
  };
};

type AppChromeValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  resolvedAppName: string;
};

const AppChromeContext = createContext<AppChromeValue | null>(null);

export function useAppChrome() {
  const value = useContext(AppChromeContext);
  if (!value) {
    throw new Error('useAppChrome must be used within AppShell');
  }
  return value;
}

type AppShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export function AppShell({ children, contentClassName = 'max-w-5xl' }: AppShellProps) {
  const [showMenu, setShowMenu] = useState(false);
  const locale = useSyncExternalStore(subscribeLocale, readStoredLocale, () => DEFAULT_LOCALE);
  const [customAppName, setCustomAppName] = useState<string | null>(null);
  const { theme, setTheme } = useVisualTheme();

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const data = await getBrandingSettings();
        setCustomAppName((data as { appName?: string })?.appName?.trim() || DEFAULT_APP_NAME);
      } catch (error) {
        console.error(error);
      }
    };

    loadBranding();
  }, []);

  const t = useMemo(() => getTranslations(locale), [locale]);
  const resolvedAppName = customAppName || t.appName;
  const value = useMemo(
    () => ({ locale, setLocale, t, resolvedAppName }),
    [locale, setLocale, t, resolvedAppName]
  );

  const cycleTheme = () => {
    const idx = VISUAL_THEMES.indexOf(theme);
    setTheme(VISUAL_THEMES[(idx + 1) % VISUAL_THEMES.length]);
  };

  return (
    <AppChromeContext.Provider value={value}>
      <main
        className="min-h-screen relative flex flex-col"
        style={{ background: 'transparent', color: 'var(--text-primary)', isolation: 'isolate' }}
      >
        {/* Space background: twinkling stars + shooting stars (theme-aware) */}
        <Starfield density={0.35} />
        {/* ========== NAVBAR ========== */}
        <header
          className="sticky top-0 z-50"
          style={{ background: 'var(--brutal-accent)', borderBottom: '2px solid var(--ink)' }}
        >
          <div className="max-w-6xl mx-auto px-4 h-[62px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 no-underline" style={{ color: 'var(--brutal-on-accent)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail className="h-5 w-5" style={{ color: 'var(--brutal-accent)' }} />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{resolvedAppName}</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <div style={{ display: 'flex', border: '2px solid var(--ink)', borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--brutal-shadow-sm)', background: 'var(--surface)' }}>
                <button
                  onClick={() => setLocale('en')}
                  style={{
                    padding: '5px 11px',
                    border: 'none',
                    borderRight: '2px solid var(--ink)',
                    background: locale === 'en' ? 'var(--brutal-accent-2)' : 'var(--surface)',
                    color: locale === 'en' ? 'var(--brutal-on-accent)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'background 0.15s',
                  }}
                >EN</button>
                <button
                  onClick={() => setLocale('id')}
                  style={{
                    padding: '5px 11px',
                    border: 'none',
                    background: locale === 'id' ? 'var(--brutal-accent-2)' : 'var(--surface)',
                    color: locale === 'id' ? 'var(--brutal-on-accent)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'background 0.15s',
                  }}
                >ID</button>
              </div>

              {/* Theme Cycle Button */}
              <button
                onClick={cycleTheme}
                title={t.themeLabel}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '2px solid var(--ink)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--brutal-shadow-sm)',
                  transition: 'transform 0.12s, box-shadow 0.12s',
                }}
              >
                {theme === 'brutal' ? (
                  <Sun className="h-4 w-4" />
                ) : theme === 'candy' ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: '2px solid var(--ink)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--brutal-shadow-sm)',
                    transition: 'transform 0.12s, box-shadow 0.12s',
                  }}
                >
                  <Menu className="h-4 w-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <motion.div
                        className="brutal-menu-dropdown"
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.08, ease: 'easeOut' }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          zIndex: 50,
                          marginTop: 8,
                          width: 240,
                          borderRadius: 14,
                          border: '2px solid var(--ink)',
                          background: 'var(--surface)',
                          boxShadow: 'var(--brutal-shadow-lg)',
                          overflow: 'hidden',
                        }}
                      >
                        <div className="p-2 space-y-1">
                          <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)' }}>
                            Menu
                          </div>
                          <ThemePicker t={t} compact />
                          <a
                            href="/api-access"
                            onClick={() => setShowMenu(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Code2 className="h-4 w-4" />
                            API Doc
                          </a>
                          <a
                            href="/tools"
                            onClick={() => setShowMenu(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Wrench className="h-4 w-4" />
                            Tools
                          </a>
                          <a
                            href="/admin"
                            onClick={() => setShowMenu(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Shield className="h-4 w-4" />
                            Admin
                          </a>
                          <a
                            href="https://github.com/yasirarism"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowMenu(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Github className="h-4 w-4" />
                            GitHub
                          </a>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <section className={cn(contentClassName, 'mx-auto px-4 py-10 w-full')}>
          {children}
        </section>
      </main>
    </AppChromeContext.Provider>
  );
}
