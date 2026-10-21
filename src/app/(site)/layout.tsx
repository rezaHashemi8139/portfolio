import type { Viewport } from 'next';
import { Inter, Instrument_Serif, Montserrat } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { getContent } from '@/lib/content';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/components.css';
import '@/styles/sections.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--nf-serif', display: 'swap' });
const display = Montserrat({ subsets: ['latin'], variable: '--nf-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--nf-body', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0d0d1a',
};

// Resolve theme before first paint: saved choice → host/root attribute → OS preference → dark.
// Also flags that JavaScript is running, so the preloader layer only exists when it can actually finish.
const BOOTSTRAP = `(function(){var d=document.documentElement;d.classList.add('js');var t=null;try{t=localStorage.getItem('sd-theme')}catch(e){}if(t!=='light'&&t!=='dark'){var h=d.getAttribute('data-theme');if(h==='light'||h==='dark')t=h;else t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.setAttribute('data-theme',t)})();`;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();

  return (
    // suppressHydrationWarning: the bootstrap script sets data-theme / class on <html> before React hydrates.
    <html lang={content.site.language} className={`${serif.variable} ${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />
      </head>
      <body>
        <ThemeProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          {children}
        </ThemeProvider>
        <noscript>
          <div style={{ padding: '24px 20px', fontFamily: 'system-ui', textAlign: 'center' }}>
            Some animations and the 3D scene need JavaScript, but everything on this page is readable without it.
          </div>
        </noscript>
      </body>
    </html>
  );
}
