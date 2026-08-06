'use client';

import {NextIntlClientProvider} from 'next-intl';
import type {AbstractIntlMessages, Locale} from 'next-intl';

export function LocaleProvider({children, locale, messages}: {children: React.ReactNode; locale: Locale; messages: AbstractIntlMessages}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Zagreb">
      {children}
    </NextIntlClientProvider>
  );
}
