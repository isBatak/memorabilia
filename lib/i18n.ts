export const locales = ['hr', 'en'] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = '/') {
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}
