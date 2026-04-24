// eslint-disable-next-line import/no-unresolved
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { JetBrains_Mono, Oxanium } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/src/components/theme-provider';
import { moderatMono, stolzl } from '@/src/lib/fonts';

import './globals.css';
import './24/hack24.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hack.platan.us'),
  title: 'Platanus Hack 26: Latam Tour',
  description:
    'De cero a producto en 36 horas con los mejores hackers de Latam. Argentina - México - Colombia - Chile',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const oxanium = Oxanium({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-oxanium',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const _THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${oxanium.variable} ${jetBrainsMono.variable} ${GeistSans.variable} ${moderatMono.variable} ${stolzl.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
