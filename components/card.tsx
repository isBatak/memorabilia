'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {css} from '#styled-system/css';
import type {ArchiveCard} from '../lib/archive';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function MediaCard({item, priority = false}: {item: ArchiveCard; priority?: boolean}) {
  const t = useTranslations('common');
  const label = item.category === 'cartoons' ? 'CRTANI' : item.category === 'series' ? 'SERIJA' : 'FILM';

  return (
    <Link
      href={`/${item.category}/${item.slug}/`}
      className={css({
        display: 'block',
        minW: {base: '72vw', sm: '17rem'},
        maxW: {base: '72vw', sm: '17rem'},
        scrollSnapAlign: 'start',
        borderRadius: '18px',
        overflow: 'hidden',
        bg: 'panel',
        border: '1px solid',
        borderColor: 'line',
        transition: 'transform .25s ease, border-color .25s ease, box-shadow .25s ease',
        _hover: {transform: 'translateY(-5px)', borderColor: 'rgba(197,244,103,.45)', boxShadow: '0 18px 55px rgba(0,0,0,.35)'},
        _focusVisible: {outline: '2px solid', outlineColor: 'lime', outlineOffset: '4px'}
      })}
    >
      <div className={css({position: 'relative', aspectRatio: '16/10', overflow: 'hidden', bg: '#1c1f26'})}>
        {item.image ? (
          <img
            src={`${basePath}${item.image}`}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            className={css({w: '100%', h: '100%', objectFit: 'cover', transition: 'transform .45s ease', _groupHover: {transform: 'scale(1.04)'}})}
          />
        ) : (
          <div className={css({w: '100%', h: '100%', display: 'grid', placeItems: 'center', bg: 'linear-gradient(145deg, #20242d, #111318)'})}>
            <span className={css({fontFamily: 'display', fontSize: '4xl', fontWeight: 700, color: 'rgba(255,255,255,.3)'})}>{item.title.slice(0, 1)}</span>
          </div>
        )}
        <span className={css({position: 'absolute', top: 3, left: 3, bg: 'rgba(8,9,11,.78)', color: 'paper', backdropFilter: 'blur(8px)', px: 2.5, py: 1, borderRadius: 'full', fontSize: '10px', fontWeight: 800, letterSpacing: '.12em'})}>
          {label}
        </span>
      </div>
      <div className={css({p: 4})}>
        <h3 className={css({fontFamily: 'display', fontSize: 'md', fontWeight: 700, lineHeight: 1.25, lineClamp: 1})}>{item.title}</h3>
        <p className={css({mt: 2, color: 'muted', fontSize: 'sm', lineHeight: 1.55, lineClamp: 2, minH: '2.75rem'})}>
          {item.summary || t('titleOnly')}
        </p>
      </div>
    </Link>
  );
}
