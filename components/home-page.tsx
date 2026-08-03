'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {ArrowRight, Database, ImageIcon, Play, Sparkles} from 'lucide-react';
import {css, cx} from '#styled-system/css';
import {button} from '#styled-system/recipes';
import {hstack} from '#styled-system/patterns';
import {ArchiveBadge} from './archive-badge';
import {MediaCard} from './card';
import type {ArchiveCard, Category} from '../lib/archive';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function Rail({id, title, items}: {id: string; title: string; items: ArchiveCard[]}) {
  return (
    <section id={id} className={css({scrollMarginTop: 20})}>
      <div className={css({display: 'flex', justifyContent: 'space-between', alignItems: 'end', px: {base: 5, md: 9}})}>
        <h2 className={css({fontFamily: 'display', fontSize: {base: 'xl', md: '2xl'}, letterSpacing: '-.03em', display: 'flex', alignItems: 'center', gap: 3, _before: {content: '""', w: 2, h: 2, borderRadius: 'full', bg: 'lime.500'}})}>{title}</h2>
        <span className={css({color: 'gray.600', fontSize: 'xs', fontWeight: 800, px: 2.5, py: 1, borderRadius: 'full', bg: 'gray.100', _dark: {color: 'gray.300', bg: 'gray.900'}})}>{items.length.toString().padStart(2, '0')}</span>
      </div>
      <div
        data-carousel
        className={css({
          display: 'flex',
          gap: {base: 3, md: 4},
          overflowX: 'auto',
          px: {base: 5, md: 9},
          pt: 5,
          pb: {base: '16', md: '20'},
          // scrollSnapType: 'x mandatory',
          scrollPaddingInline: {base: '1.25rem', md: '2.25rem'},
          scrollBehavior: 'smooth',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x pinch-zoom',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {display: 'none'}
        })}
      >
        {items.map((item, index) => <MediaCard key={item.slug} item={item} priority={index < 2}/>) }
      </div>
    </section>
  );
}

export function HomePage({collections, counts, imageCount}: {collections: Record<Category, ArchiveCard[]>; counts: Record<Category, number>; imageCount: number}) {
  const t = useTranslations();
  const featured = collections.cartoons.find((item) => item.slug === 'profesor-baltazar') || collections.cartoons.find((item) => item.image) || collections.cartoons[0];

  return (
    <>
      <section className={css({position: 'relative', minH: {base: '42rem', md: '47rem'}, display: 'flex', alignItems: 'end', overflow: 'hidden', color: 'gray.100', borderBottom: '1px solid', borderColor: 'gray.800'})}>
        {featured.image && <img src={`${basePath}${featured.image}`} alt="" className={css({position: 'absolute', inset: 0, w: '100%', h: '100%', objectFit: 'cover', objectPosition: 'center 25%', filter: 'saturate(.75) contrast(1.05)', opacity: .72})}/>} 
        <div className={css({position: 'absolute', inset: 0, bg: 'linear-gradient(90deg, token(colors.black) 3%, token(colors.black/76) 43%, token(colors.black/18) 76%), linear-gradient(to top, token(colors.black) 0%, transparent 58%)'})}/>
        <div className={css({position: 'relative', zIndex: 1, maxW: '52rem', px: {base: 5, md: 9}, pb: {base: 12, md: 16}, pt: 28, animationName: 'slide-from-bottom, fade-in', animationDuration: 'slowest', animationTimingFunction: 'ease-out', animationFillMode: 'both'})}>
          <ArchiveBadge className={css({mb: 5})}><Sparkles size={15}/>{t('home.eyebrow')}</ArchiveBadge>
          <h1 className={css({fontFamily: 'display', maxW: '48rem', fontSize: {base: '4xl', sm: '6xl', md: '7xl'}, lineHeight: .94, letterSpacing: '-.065em', fontWeight: 750})}>{t('home.title')}</h1>
          <p className={css({maxW: '42rem', mt: 6, color: 'gray.300', fontSize: {base: 'md', md: 'lg'}, lineHeight: 1.65})}>{t('home.intro')}</p>
          <div className={hstack({flexWrap: 'wrap', gap: 3, mt: 8})}>
            <Link href={`/${featured.category}/${featured.slug}/`} className={cx(button({variant: 'solid', size: 'lg'}), css({colorPalette: 'red', bg: 'gray.100', color: 'black', borderRadius: 'full', fontWeight: 800, fontSize: 'sm', _hover: {bg: 'gray.100', transform: 'scale(1.03)'}}))}><Play size={17} fill="currentColor"/>{t('common.readMore')}</Link>
            <a href="#cartoons" className={cx(button({variant: 'outline', size: 'lg'}), css({colorPalette: 'gray', color: 'gray.100', bg: 'white/11', backdropFilter: 'blur(9px)', borderColor: 'white/14', borderRadius: 'full', fontWeight: 750, fontSize: 'sm'}))}>{t('common.browse')}<ArrowRight size={17}/></a>
          </div>
        </div>
        <div className={css({position: 'absolute', right: {base: 5, md: 9}, bottom: {base: 5, md: 8}, zIndex: 2, display: {base: 'none', sm: 'block'}, textAlign: 'right'})}>
          <span className={css({display: 'block', color: 'lime.300', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 800})}>{t('home.featured')}</span>
          <strong className={css({fontFamily: 'display', fontSize: 'lg'})}>{featured.title}</strong>
        </div>
      </section>

      <div className={css({pt: {base: 12, md: 16}})}>
        <Rail id="cartoons" title={t('home.cartoonRail')} items={[...collections.cartoons].sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))}/>
        <Rail id="series" title={t('home.seriesRail')} items={[...collections.series].sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))}/>
        <Rail id="movies" title={t('home.movieRail')} items={[...collections.movies].sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))}/>
      </div>

      <section id="about" className={css({mx: {base: 5, md: 9}, my: {base: 16, md: 24}, borderRadius: {base: '22px', md: '30px'}, overflow: 'hidden', bg: 'lime.300', color: 'black', p: {base: 6, md: 12}, position: 'relative', boxShadow: '0 24px 70px token(colors.lime.500/18)'})}>
        <div className={css({position: 'absolute', right: '-3rem', top: '-6rem', w: '22rem', h: '22rem', border: '1px solid', borderColor: 'black/18', borderRadius: 'full', _after: {content: '""', position: 'absolute', inset: 12, border: '1px solid', borderColor: 'black/15', borderRadius: 'full'}})}/>
        <div className={css({position: 'relative', maxW: '55rem'})}>
          <Database size={28}/>
          <h2 className={css({fontFamily: 'display', fontSize: {base: '3xl', md: '5xl'}, lineHeight: 1, letterSpacing: '-.05em', mt: 6})}>{t('home.archiveTitle')}</h2>
          <p className={css({maxW: '48rem', mt: 6, fontSize: {base: 'md', md: 'lg'}, lineHeight: 1.65, color: 'black/72'})}>{t('home.archiveText')}</p>
          <div className={css({display: 'grid', gridTemplateColumns: {base: 'repeat(3,1fr)'}, gap: 3, mt: 10, pt: 8, borderTop: '1px solid', borderColor: 'black/18'})}>
            <div><strong className={css({display: 'block', fontFamily: 'display', fontSize: {base: '2xl', md: '4xl'}})}>{counts.cartoons + counts.series + counts.movies}</strong><span className={css({fontSize: {base: '10px', md: 'sm'}, fontWeight: 700})}>{t('home.entries')}</span></div>
            <div><strong className={css({display: 'block', fontFamily: 'display', fontSize: {base: '2xl', md: '4xl'}})}>{imageCount}+</strong><span className={css({fontSize: {base: '10px', md: 'sm'}, fontWeight: 700})}>{t('home.images')}</span></div>
            <div><strong className={css({display: 'block', fontFamily: 'display', fontSize: {base: '2xl', md: '4xl'}})}>03</strong><span className={css({fontSize: {base: '10px', md: 'sm'}, fontWeight: 700})}>{t('home.categories')}</span></div>
          </div>
        </div>
      </section>

      <footer className={css({px: {base: 5, md: 9}, py: 10, borderTop: '1px solid', borderColor: 'gray.200', display: {base: 'grid', md: 'flex'}, gap: 4, alignItems: 'center', justifyContent: 'space-between', color: 'gray.600', fontSize: 'sm', _dark: {borderColor: 'gray.800', color: 'gray.400'}})}>
        <p>{t('footer.copy')}</p>
        <a href={`${basePath}/api/v1/index.json`} className={css({display: 'inline-flex', alignItems: 'center', gap: 2, color: 'gray.950', fontWeight: 700, _hover: {color: 'lime.700'}, _dark: {color: 'gray.50', _hover: {color: 'lime.300'}}})}><Database size={15}/>{t('footer.data')}</a>
      </footer>
    </>
  );
}
