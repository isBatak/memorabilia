import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {AboutPage} from '../../../components/about-page';
import type {Locale} from '../../../lib/i18n';

export async function generateMetadata({params}: {params: Promise<{lang: Locale}>}): Promise<Metadata> {
  const {lang} = await params;
  const t = await getTranslations({locale: lang, namespace: 'nav'});
  return {title: t('about')};
}

export default function Page() {
  return <AboutPage/>;
}
