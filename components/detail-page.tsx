'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {ArrowLeft, ArrowUpRight, CalendarDays} from 'lucide-react';
import {css} from '#styled-system/css';
import {AdSlot} from './ad-slot';
import {ArchiveGallery} from './archive-gallery';
import {MediaCard} from './card';
import type {ArchiveCard, ArchiveEntry} from '../lib/archive';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function DetailPage({entry, related}: {entry: ArchiveEntry; related: ArchiveCard[]}) {
  const t = useTranslations();
  const hero = entry.images.find((image) => image.localUrl)?.localUrl;
  const article = entry.paragraphs?.[0] || '';
  const sections = article.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const source = entry.source?.resolvedArchiveUrl || entry.source?.originalUrl;

  return (
    <article>
      <header className={css({position: 'relative', minH: {base: '34rem', md: '44rem'}, display: 'flex', alignItems: 'end', overflow: 'hidden', color: 'gray.100'})}>
        {hero ? <img src={`${basePath}${hero}`} alt="" className={css({position: 'absolute', inset: 0, w: '100%', h: '100%', objectFit: 'cover', objectPosition: 'center 28%', opacity: .72, filter: 'saturate(.76)'})}/> : <div className={css({position: 'absolute', inset: 0, bg: 'radial-gradient(circle at 70% 30%, token(colors.gray.700) 0%, token(colors.gray.900) 40%, token(colors.black) 75%)'})}/>}
        <div className={css({position: 'absolute', inset: 0, bg: 'linear-gradient(to top, token(colors.black) 3%, token(colors.black/68) 44%, token(colors.black/10) 82%), linear-gradient(90deg, token(colors.black/72), transparent 75%)'})}/>
        <div className={css({position: 'relative', zIndex: 1, w: '100%', px: {base: 5, md: 9}, pb: {base: 9, md: 12}, pt: 24})}>
          <Link href="/" className={css({display: 'inline-flex', alignItems: 'center', gap: 2, color: 'gray.300', fontSize: 'sm', mb: 8, _hover: {color: 'lime.300'}})}><ArrowLeft size={17}/>{t('common.back')}</Link>
          <p className={css({color: 'lime.300', fontSize: 'xs', fontWeight: 850, letterSpacing: '.15em', textTransform: 'uppercase', mb: 3})}>{t('detail.archiveEntry')} · {t(`nav.${entry.category}`)}</p>
          <h1 className={css({fontFamily: 'display', fontSize: {base: '4xl', sm: '6xl', md: '7xl'}, lineHeight: .94, letterSpacing: '-.06em', maxW: '55rem'})}>{entry.title}</h1>
          <div className={css({display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, mt: 6, color: 'gray.300', fontSize: 'sm'})}>
            {entry.publishedAt && <span className={css({display: 'inline-flex', alignItems: 'center', gap: 2})}><CalendarDays size={16}/>{t('common.published')} {entry.publishedAt}</span>}
            <span>{t('common.preserved')}</span>
          </div>
        </div>
      </header>

      <div className={css({display: 'grid', gridTemplateColumns: {base: '1fr', xl: 'minmax(0, 46rem) 18rem'}, gap: {base: 10, xl: 16}, px: {base: 5, md: 9}, py: {base: 12, md: 18}, maxW: '88rem'})}>
        <section>
          <h2 className={css({fontFamily: 'display', fontSize: '2xl', letterSpacing: '-.03em', mb: 7})}>{t('detail.article')}</h2>
          {sections.length ? <div className={css({display: 'grid', gap: 6, color: 'gray.900', fontSize: {base: 'md', md: 'lg'}, lineHeight: 1.82, _dark: {color: 'gray.100'}})}>{sections.map((section, index) => <p key={index} className={css({whiteSpace: 'pre-line'})}>{section}</p>)}</div> : <div className={css({border: '1px dashed', borderColor: 'gray.300', borderRadius: '16px', p: 8, color: 'gray.600', bg: 'white', _dark: {borderColor: 'gray.700', color: 'gray.400', bg: 'gray.950'}})}>{t('common.titleOnly')}</div>}
        </section>
        <aside className={css({alignSelf: 'start', position: {xl: 'sticky'}, top: 8, borderTop: '3px solid', borderColor: 'lime.500', pt: 5, p: 5, bg: 'white', borderRadius: '0 0 16px 16px', boxShadow: '0 14px 34px token(colors.black/7)', _dark: {bg: 'gray.950', boxShadow: '0 16px 38px token(colors.black/35)'}})}>
          <p className={css({fontSize: 'xs', textTransform: 'uppercase', letterSpacing: '.13em', color: 'gray.600', mb: 4, _dark: {color: 'gray.400'}})}>Memorabilia JSON</p>
          <dl className={css({display: 'grid', gap: 4, fontSize: 'sm'})}>
            <div><dt className={css({color: 'gray.600', fontSize: 'xs', _dark: {color: 'gray.400'}})}>Slug</dt><dd className={css({mt: 1, wordBreak: 'break-all'})}>{entry.slug}</dd></div>
            <div><dt className={css({color: 'gray.600', fontSize: 'xs', _dark: {color: 'gray.400'}})}>Schema</dt><dd className={css({mt: 1})}>v1 · static JSON</dd></div>
            <div><dt className={css({color: 'gray.600', fontSize: 'xs', _dark: {color: 'gray.400'}})}>{t('common.gallery')}</dt><dd className={css({mt: 1})}>{entry.images.length}</dd></div>
          </dl>
          {source && <a href={source} target="_blank" rel="noreferrer" className={css({mt: 6, display: 'inline-flex', alignItems: 'center', gap: 2, color: 'lime.700', fontSize: 'sm', fontWeight: 750, _hover: {color: 'lime.600'}, _dark: {color: 'lime.300'}})}>{t('common.originalSource')}<ArrowUpRight size={15}/></a>}
        </aside>
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT}/>

      <ArchiveGallery images={entry.images} title={t('common.gallery')} entryTitle={entry.title} basePath={basePath}/>

      <section className={css({py: {base: 12, md: 16}, borderTop: '1px solid', borderColor: 'gray.200', _dark: {borderColor: 'gray.800'}})}>
        <h2 className={css({px: {base: 5, md: 9}, fontFamily: 'display', fontSize: '2xl', mb: 6})}>{t('detail.more')}</h2>
        <div data-carousel className={css({display: 'flex', gap: {base: 3, md: 4}, overflowX: 'auto', px: {base: 5, md: 9}, pb: 7, scrollSnapType: 'x mandatory', scrollPaddingInline: {base: '1.25rem', md: '2.25rem'}, scrollBehavior: 'smooth', overscrollBehaviorX: 'contain', touchAction: 'pan-x pinch-zoom', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', '&::-webkit-scrollbar': {display: 'none'}})}>{related.map((item) => <MediaCard key={item.slug} item={item}/>)}</div>
      </section>
    </article>
  );
}
