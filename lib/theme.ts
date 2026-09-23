export const THEME_STORAGE_KEY = 'vaultmail_theme';
export const THEME_EVENT = 'vaultmail-theme-change';
export const VISUAL_THEMES = ['brutal', 'glass', 'neomorph', 'candy'] as const;

export type VisualTheme = (typeof VISUAL_THEMES)[number];
export const DEFAULT_THEME: VisualTheme = 'brutal';

export const isVisualTheme = (value: string | null): value is VisualTheme =>
  value === 'brutal' || value === 'glass' || value === 'neomorph' || value === 'candy';

export const applyTheme = (theme: VisualTheme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
};

export const readStoredTheme = (): VisualTheme => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isVisualTheme(stored)) return stored;
  } catch {
    // Ignore unavailable storage.
  }
  // Fall back to whatever the bootstrap script resolved for this visitor
  // (the admin-configured site default) before touching localStorage again.
  if (typeof document !== 'undefined') {
    const current = document.documentElement.getAttribute('data-theme');
    if (isVisualTheme(current)) return current;
  }
  return DEFAULT_THEME;
};

export const setStoredTheme = (theme: VisualTheme) => {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
};

export const subscribeTheme = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
};

export const buildThemeBootstrapScript = (fallback: VisualTheme) =>
  `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.setAttribute('data-theme',(t==='candy'||t==='neomorph'||t==='glass'||t==='brutal')?t:'${fallback}');}catch(e){document.documentElement.setAttribute('data-theme','${fallback}');}})();`;

export const THEME_BOOTSTRAP_SCRIPT = buildThemeBootstrapScript(DEFAULT_THEME);
