'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {ArrowLeft, ArrowUpRight, CalendarDays, ImageIcon} from 'lucide-react';
import {css} from '#styled-system/css';
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
      <header className={css({position: 'relative', minH: {base: '34rem', md: '44rem'}, display: 'flex', alignItems: 'end', overflow: 'hidden', color: 'paper'})}>
        {hero ? <img src={`${basePath}${hero}`} alt="" className={css({position: 'absolute', inset: 0, w: '100%', h: '100%', objectFit: 'cover', objectPosition: 'center 28%', opacity: .72, filter: 'saturate(.76)'})}/> : <div className={css({position: 'absolute', inset: 0, bg: 'radial-gradient(circle at 70% 30%, #343944 0%, #15171d 40%, #08090b 75%)'})}/>} 
        <div className={css({position: 'absolute', inset: 0, bg: 'linear-gradient(to top, #08090b 3%, rgba(8,9,11,.68) 44%, rgba(8,9,11,.1) 82%), linear-gradient(90deg, rgba(8,9,11,.72), transparent 75%)'})}/>
        <div className={css({position: 'relative', zIndex: 1, w: '100%', px: {base: 5, md: 9}, pb: {base: 9, md: 12}, pt: 24})}>
          <Link href="/" className={css({display: 'inline-flex', alignItems: 'center', gap: 2, color: '#d3d4d7', fontSize: 'sm', mb: 8, _hover: {color: 'lime'}})}><ArrowLeft size={17}/>{t('common.back')}</Link>
          <p className={css({color: 'lime', fontSize: 'xs', fontWeight: 850, letterSpacing: '.15em', textTransform: 'uppercase', mb: 3})}>{t('detail.archiveEntry')} · {t(`nav.${entry.category}`)}</p>
          <h1 className={css({fontFamily: 'display', fontSize: {base: '4xl', sm: '6xl', md: '7xl'}, lineHeight: .94, letterSpacing: '-.06em', maxW: '55rem'})}>{entry.title}</h1>
          <div className={css({display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, mt: 6, color: '#c6c8cc', fontSize: 'sm'})}>
            {entry.publishedAt && <span className={css({display: 'inline-flex', alignItems: 'center', gap: 2})}><CalendarDays size={16}/>{t('common.published')} {entry.publishedAt}</span>}
            <span>{t('common.preserved')}</span>
          </div>
        </div>
      </header>

      <div className={css({display: 'grid', gridTemplateColumns: {base: '1fr', xl: 'minmax(0, 46rem) 18rem'}, gap: {base: 10, xl: 16}, px: {base: 5, md: 9}, py: {base: 12, md: 18}, maxW: '88rem'})}>
        <section>
          <h2 className={css({fontFamily: 'display', fontSize: '2xl', letterSpacing: '-.03em', mb: 7})}>{t('detail.article')}</h2>
          {sections.length ? <div className={css({display: 'grid', gap: 6, color: 'cream', fontSize: {base: 'md', md: 'lg'}, lineHeight: 1.82})}>{sections.map((section, index) => <p key={index} className={css({whiteSpace: 'pre-line'})}>{section}</p>)}</div> : <div className={css({border: '1px dashed', borderColor: 'line', borderRadius: '16px', p: 8, color: 'muted'})}>{t('common.titleOnly')}</div>}
        </section>
        <aside className={css({alignSelf: 'start', position: {xl: 'sticky'}, top: 8, borderTop: '1px solid', borderColor: 'line', pt: 5})}>
          <p className={css({fontSize: 'xs', textTransform: 'uppercase', letterSpacing: '.13em', color: 'muted', mb: 4})}>Memorabilia JSON</p>
          <dl className={css({display: 'grid', gap: 4, fontSize: 'sm'})}>
            <div><dt className={css({color: 'muted', fontSize: 'xs'})}>Slug</dt><dd className={css({mt: 1, wordBreak: 'break-all'})}>{entry.slug}</dd></div>
            <div><dt className={css({color: 'muted', fontSize: 'xs'})}>Schema</dt><dd className={css({mt: 1})}>v1 · static JSON</dd></div>
            <div><dt className={css({color: 'muted', fontSize: 'xs'})}>{t('common.gallery')}</dt><dd className={css({mt: 1})}>{entry.images.length}</dd></div>
          </dl>
          {source && <a href={source} target="_blank" rel="noreferrer" className={css({mt: 6, display: 'inline-flex', alignItems: 'center', gap: 2, color: 'lime', fontSize: 'sm', fontWeight: 750})}>{t('common.originalSource')}<ArrowUpRight size={15}/></a>}
        </aside>
      </div>

      {entry.images.length > 0 && <section className={css({px: {base: 5, md: 9}, pb: {base: 14, md: 20}})}>
        <div className={css({display: 'flex', alignItems: 'center', gap: 3, mb: 6})}><ImageIcon size={20} className={css({color: 'lime'})}/><h2 className={css({fontFamily: 'display', fontSize: '2xl'})}>{t('common.gallery')}</h2><span className={css({color: 'muted', fontSize: 'sm'})}>{entry.images.length}</span></div>
        <div className={css({columns: {base: 1, sm: 2, lg: 3}, columnGap: 4})}>
          {entry.images.map((image, index) => image.localUrl && <figure key={`${image.localUrl}-${index}`} className={css({breakInside: 'avoid', mb: 4, overflow: 'hidden', borderRadius: '14px', bg: 'panel', border: '1px solid', borderColor: 'line'})}><img src={`${basePath}${image.localUrl}`} alt={image.alt || `${entry.title} — ${index + 1}`} loading="lazy" className={css({w: '100%', h: 'auto'})}/></figure>)}
        </div>
      </section>}

      <section className={css({py: {base: 12, md: 16}, borderTop: '1px solid', borderColor: 'line'})}>
        <h2 className={css({px: {base: 5, md: 9}, fontFamily: 'display', fontSize: '2xl', mb: 6})}>{t('detail.more')}</h2>
        <div className={css({display: 'flex', gap: 4, overflowX: 'auto', px: {base: 5, md: 9}, pb: 6, scrollSnapType: 'x mandatory'})}>{related.map((item) => <MediaCard key={item.slug} item={item}/>)}</div>
      </section>
    </article>
  );
}
