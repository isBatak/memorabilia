'use client';

import {useTranslations} from 'next-intl';
import {css} from '#styled-system/css';
import {SupportButton} from './support-button';

export function AboutPage() {
  const t = useTranslations('about');

  return (
    <article className={css({px: {base: 5, md: 10}, pt: {base: 24, lg: 16}, pb: 20, maxW: '72rem'})}>
      <p className={css({color: 'lime.700', fontSize: 'xs', fontWeight: 850, letterSpacing: '.15em', textTransform: 'uppercase', mb: 4, _dark: {color: 'lime.300'}})}>{t('eyebrow')}</p>
      <h1 className={css({fontFamily: 'display', fontSize: {base: '4xl', md: '7xl'}, lineHeight: .95, letterSpacing: '-.055em', maxW: '50rem'})}>{t('title')}</h1>
      <p className={css({mt: 7, maxW: '46rem', color: 'gray.700', fontSize: {base: 'lg', md: 'xl'}, lineHeight: 1.7, _dark: {color: 'gray.300'}})}>{t('intro')}</p>

      <div className={css({display: 'grid', gridTemplateColumns: {base: '1fr', md: 'repeat(2, 1fr)'}, gap: 5, mt: 14})}>
        {(['preservation', 'open', 'growing', 'origin'] as const).map((key) => (
          <section key={key} className={css({p: {base: 6, md: 8}, borderRadius: '18px', bg: 'white', border: '1px solid', borderColor: 'gray.200', _dark: {bg: 'gray.950', borderColor: 'gray.800'}})}>
            <h2 className={css({fontFamily: 'display', fontSize: '2xl', mb: 3})}>{t(`${key}.title`)}</h2>
            <p className={css({color: 'gray.600', lineHeight: 1.75, _dark: {color: 'gray.400'}})}>{t(`${key}.text`)}</p>
          </section>
        ))}
      </div>

      <section className={css({mt: 10, p: {base: 7, md: 10}, borderRadius: '20px', bg: 'gray.950', color: 'gray.50', _dark: {bg: 'gray.900'}})}>
        <h2 className={css({fontFamily: 'display', fontSize: {base: '3xl', md: '4xl'}, mb: 3})}>{t('supportTitle')}</h2>
        <p className={css({maxW: '42rem', color: 'gray.300', lineHeight: 1.7, mb: 6})}>{t('supportText')}</p>
        <SupportButton/>
      </section>
    </article>
  );
}
