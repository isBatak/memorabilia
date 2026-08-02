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
      data-media-card
      href={`/${item.category}/${item.slug}/`}
      className={`group ${css({
        display: 'block',
        flexShrink: 0,
        minW: {base: '72vw', sm: '17rem'},
        maxW: {base: '72vw', sm: '17rem'},
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        borderRadius: '18px',
        overflow: 'hidden',
        bg: 'white',
        color: 'gray.950',
        border: '1px solid',
        borderColor: 'gray.200',
        boxShadow: '0 12px 35px token(colors.black/9)',
        transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
        _hover: {transform: 'translateY(-6px)', borderColor: 'lime.400', boxShadow: '0 22px 54px token(colors.black/16), 0 0 0 1px token(colors.lime.300/45)'},
        _focusVisible: {outline: '2px solid', outlineColor: 'lime.500', outlineOffset: '4px'},
        _dark: {bg: 'gray.950', color: 'gray.50', borderColor: 'gray.800', boxShadow: '0 14px 38px token(colors.black/40)', _hover: {borderColor: 'lime.500', boxShadow: '0 24px 60px token(colors.black/58), 0 0 0 1px token(colors.lime.500/35)'}}
      })}`}
    >
      <div className={css({position: 'relative', aspectRatio: '16/10', overflow: 'hidden', bg: 'gray.900'})}>
        {item.image ? (
          <img
            src={`${basePath}${item.image}`}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            className={css({w: '100%', h: '100%', objectFit: 'cover', transition: 'transform .45s ease', _groupHover: {transform: 'scale(1.04)'}})}
          />
        ) : (
          <div className={css({w: '100%', h: '100%', display: 'grid', placeItems: 'center', bg: 'linear-gradient(145deg, token(colors.gray.800), token(colors.gray.950))'})}>
            <span className={css({fontFamily: 'display', fontSize: '4xl', fontWeight: 700, color: 'white/30'})}>{item.title.slice(0, 1)}</span>
          </div>
        )}
        <span className={css({position: 'absolute', top: 3, left: 3, bg: 'black/78', color: 'gray.100', backdropFilter: 'blur(8px)', px: 2.5, py: 1, borderRadius: 'full', fontSize: '10px', fontWeight: 800, letterSpacing: '.12em'})}>
          {label}
        </span>
      </div>
      <div className={css({p: 4, borderTop: '1px solid', borderColor: 'gray.200', _dark: {borderColor: 'gray.800'}})}>
        <h3 className={css({fontFamily: 'display', fontSize: 'md', fontWeight: 700, lineHeight: 1.25, lineClamp: 1})}>{item.title}</h3>
        <p className={css({mt: 2, color: 'gray.600', fontSize: 'sm', lineHeight: 1.55, lineClamp: 2, minH: '2.75rem', _dark: {color: 'gray.400'}})}>
          {item.summary || t('titleOnly')}
        </p>
      </div>
    </Link>
  );
}
