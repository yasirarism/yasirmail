import type { Metadata } from 'next';
import './globals.css';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { Toaster } from 'sonner';
import AdsenseScript from '@/components/AdsenseScript';
import { getStoredAppName } from '@/lib/branding-settings';
import { ThemeProvider } from '@/components/theme-provider';
import { buildThemeBootstrapScript } from '@/lib/theme';
import { getStoredDefaultTheme } from '@/lib/theme-settings';

export async function generateMetadata(): Promise<Metadata> {
  const appName = await getStoredAppName();
  return {
    title: `${appName} - Secure Disposable Email`,
    description: 'Self Hosted Temporary email service with custom domains.'
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const defaultTheme = await getStoredDefaultTheme();

  return (
    <html lang={DEFAULT_LOCALE} className="dark" data-theme={defaultTheme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans" style={{ fontFamily: 'var(--font-sans)' }}>
        <script dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript(defaultTheme) }} />
        <ThemeProvider>
          <AdsenseScript />
          {children}
          <Toaster position="top-right" theme={defaultTheme === 'brutal' || defaultTheme === 'candy' ? 'light' : 'dark'} />
        </ThemeProvider>
      </body>
    </html>
  );
}
