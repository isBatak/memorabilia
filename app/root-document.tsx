import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {lang as getLang} from 'next/root-params';
import {AppShell} from '../components/app-shell';
import {LocaleProvider} from '../components/locale-provider';
import {ThemeProvider} from '../components/theme-provider';
import {getArchiveIndex} from '../lib/archive';
import {isLocale} from '../lib/i18n';
import en from '../messages/en.json';
import hr from '../messages/hr.json';

const [githubOwner, githubRepo] = process.env.GITHUB_REPOSITORY?.split('/') || [];
const githubUrl = githubOwner && githubRepo
  ? `https://${githubOwner}.github.io`
  : 'http://localhost:3000';
const socialImage = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/og.png`;

export const rootMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || githubUrl),
  title: {default: 'Memorabilia — arhiva djetinjstva', template: '%s · Memorabilia'},
  description: 'Crtani filmovi, serije i filmovi iz djetinjstva, sačuvani iz originalnog Memorabilia bloga.',
  openGraph: {title: 'Memorabilia — vrati program na početak', description: 'Digitalna videoteka djetinjstva.', type: 'website', images: [{url: socialImage, width: 1730, height: 909, alt: 'Memorabilia — vrati program na početak'}]},
  twitter: {card: 'summary_large_image', title: 'Memorabilia — vrati program na početak', description: 'Digitalna videoteka djetinjstva.', images: [socialImage]}
};

export async function RootDocument({children}: Readonly<{children: React.ReactNode}>) {
  const locale = await getLang();
  if (!isLocale(locale)) notFound();
  const {collections} = getArchiveIndex();
  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LocaleProvider locale={locale} messages={locale === 'hr' ? hr : en}>
            <AppShell collections={collections}>{children}</AppShell>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
