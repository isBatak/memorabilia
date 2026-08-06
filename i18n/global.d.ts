import type {Locale} from '../lib/i18n';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
  }
}
