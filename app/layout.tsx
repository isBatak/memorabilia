import type {Metadata} from 'next';
import Script from 'next/script';
import './globals.css';
import {LocaleProvider} from '../components/locale-provider';
import {AppShell} from '../components/app-shell';
import {ThemeProvider} from '../components/theme-provider';
import {getArchiveIndex} from '../lib/archive';

const [githubOwner, githubRepo] = process.env.GITHUB_REPOSITORY?.split('/') || [];
const githubUrl = githubOwner && githubRepo
  ? `https://${githubOwner}.github.io`
  : 'http://localhost:3000';
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const socialImage = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || githubUrl),
  title: {default: 'Memorabilia — arhiva djetinjstva', template: '%s · Memorabilia'},
  description: 'Crtani filmovi, serije i filmovi iz djetinjstva, sačuvani iz originalnog Memorabilia bloga.',
  openGraph: {title: 'Memorabilia — vrati program na početak', description: 'Digitalna videoteka djetinjstva.', type: 'website', images: [{url: socialImage, width: 1730, height: 909, alt: 'Memorabilia — vrati program na početak'}]},
  twitter: {card: 'summary_large_image', title: 'Memorabilia — vrati program na početak', description: 'Digitalna videoteka djetinjstva.', images: [socialImage]}
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  const {collections} = getArchiveIndex();
  return (
    <html lang="hr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        {adsenseClient && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
        <ThemeProvider>
          <LocaleProvider>
            <AppShell collections={collections}>{children}</AppShell>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
