'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {X} from 'lucide-react';
import {css} from '#styled-system/css';
import {SupportButton, supportUrl} from './support-button';

const delay = Number(process.env.NEXT_PUBLIC_SUPPORT_TOAST_DELAY_MS || 30000);

export function SupportToast() {
  const t = useTranslations('support');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!supportUrl || sessionStorage.getItem('memorabilia-support-dismissed')) return;
    const timer = window.setTimeout(() => setOpen(true), Number.isFinite(delay) ? Math.max(0, delay) : 30000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  function dismiss() {
    sessionStorage.setItem('memorabilia-support-dismissed', 'true');
    setOpen(false);
  }

  return (
    <aside
      aria-label={t('title')}
      className={css({
        position: 'fixed', right: {base: 4, md: 6}, bottom: {base: 4, md: 6}, zIndex: 60,
        w: 'min(calc(100vw - 2rem), 22rem)', p: 5, pr: 12, borderRadius: '16px',
        bg: 'white', color: 'gray.950', border: '1px solid', borderColor: 'gray.200',
        boxShadow: '0 18px 60px token(colors.black/20)',
        animation: 'supportToastIn .35s ease-out',
        _dark: {bg: 'gray.950', color: 'gray.50', borderColor: 'gray.800'}
      })}
    >
      <button onClick={dismiss} aria-label={t('close')} className={css({position: 'absolute', top: 3, right: 3, display: 'grid', placeItems: 'center', w: 8, h: 8, border: 0, borderRadius: 'full', bg: 'transparent', color: 'gray.500', cursor: 'pointer', _hover: {bg: 'gray.100', color: 'gray.950'}, _dark: {_hover: {bg: 'gray.800', color: 'gray.50'}}})}>
        <X size={16}/>
      </button>
      <strong className={css({display: 'block', fontFamily: 'display', fontSize: 'lg', mb: 1})}>{t('title')}</strong>
      <p className={css({color: 'gray.600', fontSize: 'sm', lineHeight: 1.55, mb: 4, _dark: {color: 'gray.400'}})}>{t('toast')}</p>
      <SupportButton/>
    </aside>
  );
}
