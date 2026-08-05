'use client';

import {NextIntlClientProvider} from 'next-intl';
import {createContext, useContext} from 'react';
import type {AbstractIntlMessages} from 'next-intl';
import type {Locale} from '../lib/i18n';

const LocaleContext = createContext<Locale>('hr');

export function LocaleProvider({children, locale, messages}: {children: React.ReactNode; locale: Locale; messages: AbstractIntlMessages}) {
  return (
    <LocaleContext.Provider value={locale}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Zagreb">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleChoice() {
  return useContext(LocaleContext);
}
