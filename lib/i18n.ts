import i18nConfig from '../i18n/config.json';

export const locales = ['hr', 'en'] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

if (!isLocale(i18nConfig.defaultLocale)) {
  throw new Error(`Invalid default locale: ${i18nConfig.defaultLocale}`);
}

export const defaultLocale: Locale = i18nConfig.defaultLocale;

export function localizedPath(locale: Locale, path = '/') {
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}
