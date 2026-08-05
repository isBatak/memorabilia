'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {css, cx} from '#styled-system/css';
import {useLocaleChoice} from './locale-provider';
import type {ArchiveCard} from '../lib/archive';
import {localizedPath} from '../lib/i18n';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function MediaCard({
  item,
  priority = false,
  layout = 'rail',
  onNavigate
}: {
  item: ArchiveCard;
  priority?: boolean;
  layout?: 'rail' | 'grid';
  onNavigate?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocaleChoice();

  return (
    <Link
      data-media-card
      href={localizedPath(locale, `/${item.category}/${item.slug}/`)}
      onClick={onNavigate}
      aria-label={item.title}
      className={cx(
        'group',
        css({
          position: 'relative',
          display: 'block',
          minW: 0,
          aspectRatio: '16/10',
          overflow: 'hidden',
          borderRadius: {base: '14px', md: '18px'},
          bg: 'gray.900',
          color: 'white',
          border: '1px solid',
          borderColor: 'white/10',
          boxShadow: '0 12px 34px token(colors.black/18)',
          transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
          _hover: {
            transform: 'translateY(-6px) scale(1.015)',
            borderColor: 'lime.400',
            boxShadow: '0 24px 58px token(colors.black/32), 0 0 0 1px token(colors.lime.300/34)'
          },
          _focusVisible: {outline: '2px solid', outlineColor: 'lime.400', outlineOffset: '4px'}
        }),
        layout === 'rail' && css({
          flexShrink: 0,
          minW: {base: '72vw', sm: '17rem'},
          maxW: {base: '72vw', sm: '17rem'},
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always'
        }),
        layout === 'grid' && css({w: '100%'})
      )}
    >
      {item.image ? (
        <img
          src={`${basePath}${item.image}`}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          className={css({
            position: 'absolute',
            inset: 0,
            w: '100%',
            h: '100%',
            objectFit: 'cover',
            transition: 'transform .5s ease, filter .35s ease',
            _groupHover: {transform: 'scale(1.065)', filter: 'saturate(1.08)'}
          })}
        />
      ) : (
        <div className={css({position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bg: 'linear-gradient(145deg, token(colors.gray.700), token(colors.gray.950))'})}>
          <span aria-hidden="true" className={css({fontFamily: 'display', fontSize: '5xl', fontWeight: 750, color: 'white/18'})}>{item.title.slice(0, 1)}</span>
        </div>
      )}

      <div className={css({position: 'absolute', inset: 0, bg: 'linear-gradient(to top, token(colors.black/94) 0%, token(colors.black/64) 30%, transparent 68%)', transition: 'opacity .3s ease', _groupHover: {opacity: .92}})}/>
      <span className={css({position: 'absolute', top: 3, left: 3, px: 2.5, py: 1, borderRadius: 'full', bg: 'black/58', color: 'lime.200', backdropFilter: 'blur(10px)', fontSize: '9px', fontWeight: 850, letterSpacing: '.12em', textTransform: 'uppercase'})}>
        {t(`nav.${item.category}`)}
      </span>
      <div className={css({position: 'absolute', left: 0, right: 0, bottom: 0, p: {base: 3.5, md: 4}})}>
        <h3 className={css({fontFamily: 'display', fontSize: {base: 'md', md: 'lg'}, fontWeight: 750, lineHeight: 1.12, letterSpacing: '-.025em', textShadow: '0 2px 16px token(colors.black)', lineClamp: 2})}>{item.title}</h3>
      </div>
    </Link>
  );
}
