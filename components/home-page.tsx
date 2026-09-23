'use client';

import { InboxInterface } from "@/components/inbox-interface";
import { Starfield } from "@/components/starfield";
import { Menu, Zap, Shield, Globe, Code2, Mail, Sun, Moon, Sparkles, Github, Wrench, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  DEFAULT_LOCALE,
  getRetentionOptions,
  getTranslations,
  Locale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";
import { DEFAULT_APP_NAME } from "@/lib/branding";
import { useVisualTheme } from "@/components/theme-provider";
import { VISUAL_THEMES, type VisualTheme } from "@/lib/theme";
import { ThemePicker } from "@/components/theme-picker";
import Link from "next/link";
import { getRetentionSettings, getBrandingSettings } from '@/app/actions/email';

interface HomePageProps {
  initialAddress?: string;
}

const STORAGE_KEY = 'vaultmail_locale';

export function HomePage({ initialAddress }: HomePageProps) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [showMenu, setShowMenu] = useState(false);
  const [retentionSeconds, setRetentionSeconds] = useState(86400);
  const [customAppName, setCustomAppName] = useState<string | null>(null);
  const [heroTitle, setHeroTitle] = useState('Temp Mail');
  const [heroDescription, setHeroDescription] = useState('Spin up secure temporary inboxes in seconds. Bring your own domain or use the default.');
  const [announcement, setAnnouncement] = useState('');
  const { theme, setTheme } = useVisualTheme();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      setLocale(stored as Locale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const t = useMemo(() => getTranslations(locale), [locale]);
  const retentionOptions = useMemo(() => getRetentionOptions(locale), [locale]);
  const resolvedAppName = customAppName || t.appName;
  const retentionLabel =
    retentionOptions.find((option) => option.value === retentionSeconds)
      ?.label || retentionOptions[2]?.label || "24 Hours";

  useEffect(() => {
    const loadRetention = async () => {
      try {
        const data = await getRetentionSettings();
        if (data?.seconds) {
          setRetentionSeconds(data.seconds);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadRetention();
  }, []);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const data = await getBrandingSettings();
        const value = (data as { appName?: string })?.appName?.trim();
        setCustomAppName(value || DEFAULT_APP_NAME);
        if ((data as { headerTitle?: string })?.headerTitle?.trim()) setHeroTitle((data as { headerTitle: string }).headerTitle.trim());
        if ((data as { headerDescription?: string })?.headerDescription?.trim()) setHeroDescription((data as { headerDescription: string }).headerDescription.trim());
        if (typeof (data as { announcement?: string })?.announcement === 'string') setAnnouncement((data as { announcement: string }).announcement.trim());
      } catch (error) {
        console.error(error);
      }
    };
    loadBranding();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t.greetingMorning;
    if (hour >= 12 && hour < 15) return t.greetingAfternoon;
    if (hour >= 15 && hour < 19) return t.greetingEvening;
    return t.greetingNight;
  }, [t]);

  const hasShownGreeting = useRef(false);

  useEffect(() => {
    if (hasShownGreeting.current) return;
    const timer = setTimeout(() => {
      toast.info(greeting);
      hasShownGreeting.current = true;
    }, 300);
    return () => clearTimeout(timer);
  }, [greeting]);

  const cycleTheme = () => {
    const idx = VISUAL_THEMES.indexOf(theme);
    const next = VISUAL_THEMES[(idx + 1) % VISUAL_THEMES.length];
    setTheme(next);
  };

  // Split hero title for two-tone: last word in accent
  const heroTitleParts = useMemo(() => {
    const words = heroTitle.trim().split(' ');
    if (words.length <= 1) return { first: '', last: heroTitle };
    const last = words.pop()!;
    return { first: words.join(' '), last };
  }, [heroTitle]);

  // Tick text — uses announcement if set, else description
  const tickerText = announcement || heroDescription || t.heroSubtitle;

  return (
    <main className="min-h-screen relative flex flex-col" style={{ background: 'transparent', color: 'var(--text-primary)', isolation: 'isolate' }}>
      {/* Space background: twinkling stars + shooting stars (theme-aware) */}
      <Starfield density={0.7} />
      {/* ========== NAVBAR ========== */}
      <header className="sticky top-0 z-50" style={{ background: 'var(--brutal-accent)', borderBottom: '2px solid var(--ink)' }}>
        <div className="max-w-6xl mx-auto px-4 h-[62px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline" style={{ color: 'var(--brutal-on-accent)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              <Mail className="h-5 w-5" style={{ color: 'var(--brutal-accent)' }} />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{resolvedAppName}</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="language-toggle" style={{ display: 'flex', border: '2px solid var(--ink)', borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--brutal-shadow-sm)', background: 'var(--surface)' }}>
              <button
                type="button"
                onClick={() => setLocale('en')}
                data-active={locale === 'en'}
                style={{
                  padding: '5px 11px',
                  border: 'none',
                  borderRight: '2px solid var(--ink)',
                  background: locale === 'en' ? 'var(--brutal-accent)' : 'var(--surface)',
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
                type="button"
                onClick={() => setLocale('id')}
                data-active={locale === 'id'}
                style={{
                  padding: '5px 11px',
                  border: 'none',
                  background: locale === 'id' ? 'var(--brutal-accent)' : 'var(--surface)',
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

            {/* Hamburger menu */}
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

      {/* ========== TICKER MARQUEE ========== */}
      <div style={{ background: 'var(--brutal-accent-2)', borderBottom: '2px solid var(--ink)', overflow: 'hidden', height: 28, display: 'flex', alignItems: 'center', position: 'sticky', top: 62, zIndex: 49 }}>
        <div className="brutal-marquee-track">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--brutal-on-accent)', padding: '0 60px', letterSpacing: '0.01em', fontFamily: 'var(--font-mono)' }}>
              {tickerText}
            </span>
          ))}
        </div>
      </div>

      {/* ========== HERO + EMAIL CARD ========== */}
      <section style={{ paddingTop: 36, paddingBottom: 0, textAlign: 'center', position: 'relative' }}>
        <div className="hero-grid" />
        <div className="max-w-6xl mx-auto px-4" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
            {heroTitleParts.first && <span style={{ color: 'inherit' }}>{heroTitleParts.first} </span>}
            <span style={{ color: 'var(--brutal-accent)' }}>{heroTitleParts.last}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', marginBottom: 24, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            {heroDescription}
          </p>
        </div>
      </section>

      {/* ========== INBOX INTERFACE ========== */}
      <InboxInterface
        initialAddress={initialAddress}
        locale={locale}
        retentionLabel={retentionLabel}
      />

      {/* ========== FEATURES ========== */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            icon={<Zap className="h-6 w-6" />}
            title={t.featureInstantTitle}
            desc={t.featureInstantDesc}
          />
          <Feature
            icon={<Shield className="h-6 w-6" />}
            title={t.featurePrivacyTitle}
            desc={t.featurePrivacyDesc}
          />
          <Feature
            icon={<Globe className="h-6 w-6" />}
            title={t.featureCustomTitle}
            desc={t.featureCustomDesc}
          />
        </div>
      </section>

      {/* ========== HOW TO USE (ruangmail cara-pakai style) ========== */}
      <section id="cara-pakai-section" style={{ background: 'transparent', padding: '20px 0 48px' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div
            style={{
              background: 'var(--brutal-howto-bg)',
              border: '2px solid var(--ink)',
              borderRadius: 16,
              boxShadow: 'var(--brutal-shadow)',
              padding: '40px 32px',
              maxWidth: 900,
              margin: '0 auto',
              overflow: 'hidden',
              position: 'relative',
              transform: 'translateZ(0)',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8, letterSpacing: '-0.03em' }}>
              {t.howToTitle}
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 32, fontWeight: 500 }}>
              {t.howToSubtitle}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <HowToStep num="01" title={t.howToStep1Title} desc={t.howToStep1Desc} bg="#faae2a" />
              <HowToStep num="02" title={t.howToStep2Title} desc={t.howToStep2Desc} bg="#8bd3dd" />
              <HowToStep num="03" title={t.howToStep3Title} desc={t.howToStep3Desc} bg="#c2ace6" />
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER (ruangmail slim sticky bar) ========== */}
      <footer
      className="site-footer"
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 100,
        padding: '12px 24px',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        borderTop: '2px solid var(--ink)',
        background: 'transparent',
        isolation: 'isolate',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', color: 'var(--text-primary)', fontWeight: 600 }}>
          <span>© 2026</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>{resolvedAppName}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>modified by Yasir</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="https://github.com/yasirarism" target="_blank" rel="noopener noreferrer" title="GitHub" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <Github className="h-4 w-4" />
          </a>
          <a href="https://t.me/yasirarism" target="_blank" rel="noopener noreferrer" title="Telegram" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <Send className="h-4 w-4" />
          </a>
          <a href="mailto:mail@ysweb.eu.org" title="Email" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <Mail className="h-4 w-4" />
          </a>
          <a href="/api-access" title="API Doc" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <Code2 className="h-4 w-4" />
          </a>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="brutal-card-lg" style={{ padding: '28px 24px', background: 'var(--surface)', textAlign: 'left' }}>
      <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: 'var(--brutal-bg)', border: '2px solid var(--ink)', display: 'inline-flex', color: 'var(--text-primary)' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.88rem' }}>{desc}</p>
    </div>
  );
}

function HowToStep({ num, title, desc, bg }: { num: string; title: string; desc: string; bg: string }) {
  return (
    <div className="howto-step-card" style={{ background: bg, borderRadius: 12, padding: 24, border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)', color: '#1a1a1a' }}>
      <div data-step-num style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1a1a', marginBottom: 10, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
        {num}
      </div>
      <p style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: 6, fontSize: '0.95rem' }}>{title}</p>
      <p style={{ fontSize: '0.82rem', color: '#1a1a1a', lineHeight: 1.5, opacity: 0.7 }}>{desc}</p>
    </div>
  );
}