'use client';

import {NextIntlClientProvider} from 'next-intl';
import {createContext, useContext, useEffect, useState} from 'react';
import hr from '../messages/hr.json';
import en from '../messages/en.json';

type Locale = 'hr' | 'en';

const LocaleContext = createContext<{locale: Locale; setLocale: (locale: Locale) => void}>({
  locale: 'hr',
  setLocale: () => undefined
});

export function LocaleProvider({children}: {children: React.ReactNode}) {
  const [locale, setLocaleState] = useState<Locale>('hr');

  useEffect(() => {
    const saved = window.localStorage.getItem('memorabilia-locale');
    if (saved === 'en') setLocaleState('en');
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem('memorabilia-locale', next);
    document.documentElement.lang = next;
  }

  return (
    <LocaleContext.Provider value={{locale, setLocale}}>
      <NextIntlClientProvider locale={locale} messages={locale === 'hr' ? hr : en} timeZone="Europe/Zagreb">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleChoice() {
  return useContext(LocaleContext);
}
