import type {Metadata, Viewport} from 'next';
import {getLocale, getMessages} from 'next-intl/server';
import {AppShell} from '../components/app-shell';
import {LocaleProvider} from '../components/locale-provider';
import {ThemeProvider} from '../components/theme-provider';
import {getArchiveIndex} from '../lib/archive';

const [githubOwner, githubRepo] = process.env.GITHUB_REPOSITORY?.split('/') || [];
const githubUrl = githubOwner && githubRepo
  ? `https://${githubOwner}.github.io`
  : 'http://localhost:3000';
const socialImage = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/og.png`;

export const rootMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || githubUrl),
  title: {default: 'Memorabilia — arhiva djetinjstva', template: '%s · Memorabilia'},
  description: 'Crtani filmovi, serije, filmovi i stare reklame iz djetinjstva, sačuvani u Memorabilia arhivi.',
  openGraph: {title: 'Memorabilia — vrati program na početak', description: 'Digitalna videoteka djetinjstva.', type: 'website', images: [{url: socialImage, width: 1730, height: 909, alt: 'Memorabilia — vrati program na početak'}]},
  twitter: {card: 'summary_large_image', title: 'Memorabilia — vrati program na početak', description: 'Digitalna videoteka djetinjstva.', images: [socialImage]}
};

export const rootViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#f9fafb'},
    {media: '(prefers-color-scheme: dark)', color: '#000000'}
  ]
};

export async function RootDocument({children}: Readonly<{children: React.ReactNode}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const {collections} = getArchiveIndex();
  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LocaleProvider locale={locale} messages={messages}>
            <AppShell collections={collections}>{children}</AppShell>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
