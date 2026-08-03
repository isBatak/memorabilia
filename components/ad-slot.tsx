'use client';

import {useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import {css, cx} from '#styled-system/css';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type AdSlotProps = {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
};

const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function AdSlot({slot, format = 'auto', className}: AdSlotProps) {
  const t = useTranslations('common');
  const initialized = useRef(false);

  useEffect(() => {
    if (!publisherId || !slot || initialized.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('Unable to initialize ad slot.', error);
    }
  }, [slot]);

  if (!publisherId || !slot) return null;

  return (
    <aside
      aria-label={t('advertisement')}
      className={cx(css({px: {base: 5, md: 9}, my: {base: 10, md: 14}}), className)}
    >
      <div className={css({maxW: '70rem', mx: 'auto', overflow: 'hidden', textAlign: 'center'})}>
        <span className={css({display: 'block', mb: 2, color: 'gray.500', fontSize: '9px', lineHeight: 1, letterSpacing: '.14em', textTransform: 'uppercase'})}>
          {t('advertisement')}
        </span>
        <ins
          className="adsbygoogle"
          style={{display: 'block'}}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
