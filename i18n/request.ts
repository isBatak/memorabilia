import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {lang} from 'next/root-params';
import {isLocale} from '../lib/i18n';

export default getRequestConfig(async () => {
  const locale = await lang();
  if (!isLocale(locale)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Europe/Zagreb'
  };
});
