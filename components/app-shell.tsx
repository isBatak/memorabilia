'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useTheme} from 'next-themes';
import {useEffect, useMemo, useState} from 'react';
import {css, cx} from '#styled-system/css';
import {button} from '#styled-system/recipes';
import {hstack} from '#styled-system/patterns';
import {Clapperboard, Film, Home, Menu, Moon, Search, Sun, Tv, X} from './icons';
import {useLocaleChoice} from './locale-provider';
import type {ArchiveCard, Category} from '../lib/archive';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const wordmark = css({
  display: 'inline-flex',
  alignItems: 'baseline',
  fontFamily: 'brand',
  color: 'paper',
  fontSize: '2xl',
  lineHeight: 1,
  letterSpacing: '-.025em',
  textTransform: 'uppercase',
  textShadow: '0 2px 12px rgba(0,0,0,.45)'
});

const navItems = [
  {key: 'home', href: '/', icon: Home},
  {key: 'cartoons', href: '/#cartoons', icon: Tv},
  {key: 'series', href: '/#series', icon: Clapperboard},
  {key: 'movies', href: '/#movies', icon: Film}
] as const;

export function AppShell({children, collections}: {children: React.ReactNode; collections: Record<Category, ArchiveCard[]>}) {
  const t = useTranslations();
  const pathname = usePathname();
  const {locale, setLocale} = useLocaleChoice();
  const {resolvedTheme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const allItems = useMemo(() => Object.values(collections).flat(), [collections]);
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('hr');
    if (!normalized) return allItems.slice(0, 12);
    return allItems.filter((item) => `${item.title} ${item.summary}`.toLocaleLowerCase('hr').includes(normalized)).slice(0, 40);
  }, [allItems, query]);

  useEffect(() => {
    setMounted(true);
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const darkTheme = !mounted || resolvedTheme !== 'light';
  const themeLabel = darkTheme ? t('common.lightTheme') : t('common.darkTheme');

  const sidebar = css({
    position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 40, w: '15.5rem', bg: 'shell',
    borderRight: '1px solid var(--memorabilia-line)', px: 5, py: 6, display: 'flex', flexDirection: 'column',
    transform: {base: menuOpen ? 'translateX(0)' : 'translateX(-105%)', lg: 'none'},
    transition: 'transform .25s ease', backdropFilter: 'blur(18px)'
  });

  return (
    <div className={css({minH: '100vh'})}>
      <aside className={sidebar} aria-label="Glavna navigacija">
        <Link href="/" aria-label="Memorabilia — početna" onClick={() => setMenuOpen(false)} className={cx(wordmark, css({alignSelf: 'flex-start', mb: 10}))}>
          MEMORABILIA<span aria-hidden="true" className={css({color: 'signal'})}>.</span>
        </Link>

        <nav className={css({display: 'grid', gap: 2})}>
          {navItems.map(({key, href, icon: Icon}) => {
            const active = key === 'home' ? pathname === '/' : pathname.includes(`/${key}`);
            return (
              <Link key={key} href={href} onClick={() => setMenuOpen(false)} className={css({display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2.5, borderRadius: '10px', color: active ? 'cream' : 'muted', bg: active ? 'hover' : 'transparent', fontSize: 'sm', fontWeight: 650, transition: 'all .2s', _hover: {bg: 'hover', color: 'cream'}})}>
                <Icon size={18} strokeWidth={1.8}/><span>{t(`nav.${key}`)}</span>
              </Link>
            );
          })}
        </nav>

        <button onClick={() => setSearchOpen(true)} className={cx(button({variant: 'outline', size: 'sm'}), css({mt: 7, w: '100%', justifyContent: 'flex-start', colorPalette: 'red', borderColor: 'line', borderRadius: '12px', bg: 'soft', color: 'muted', textAlign: 'left', _hover: {color: 'cream', bg: 'hover'}}))}>
          <Search size={17}/><span className={css({fontSize: 'sm'})}>{t('common.search')}</span><kbd className={css({ml: 'auto', fontSize: '10px', border: '1px solid var(--memorabilia-line)', px: 1.5, borderRadius: '4px'})}>⌘K</kbd>
        </button>

        <div className={css({mt: 'auto', display: 'grid', gap: 5})}>
          <div>
            <p className={css({color: 'muted', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.13em', mb: 2})}>{t('common.theme')}</p>
            <button disabled={!mounted} onClick={() => setTheme(darkTheme ? 'light' : 'dark')} aria-label={themeLabel} className={cx(button({variant: 'outline', size: 'sm'}), css({w: '100%', justifyContent: 'flex-start', colorPalette: 'red', borderColor: 'line', bg: 'soft', color: 'cream', borderRadius: '10px', fontSize: 'xs', fontWeight: 750, _hover: {bg: 'hover'}, _disabled: {cursor: 'default'}}))}>
              {darkTheme ? <Sun size={16}/> : <Moon size={16}/>}<span>{themeLabel}</span>
            </button>
          </div>
          <div>
          <p className={css({color: 'muted', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.13em', mb: 2})}>{t('common.language')}</p>
          <div className={css({display: 'flex', bg: 'soft', p: 1, borderRadius: '10px'})}>
            {(['hr', 'en'] as const).map((code) => <button key={code} onClick={() => setLocale(code)} className={css({flex: 1, border: 0, borderRadius: '7px', py: 1.5, bg: locale === code ? 'cream' : 'transparent', color: locale === code ? 'ink' : 'muted', fontSize: 'xs', fontWeight: 800, cursor: 'pointer'})}>{code.toUpperCase()}</button>)}
          </div>
          </div>
        </div>
      </aside>

      {menuOpen && <button aria-label={t('common.close')} onClick={() => setMenuOpen(false)} className={css({position: 'fixed', inset: 0, zIndex: 30, bg: 'rgba(0,0,0,.66)', border: 0, lg: {display: 'none'}})}/>} 

      <header className={css({position: 'fixed', zIndex: 25, top: 0, left: 0, right: 0, h: 16, px: 4, display: {base: 'flex', lg: 'none'}, alignItems: 'center', justifyContent: 'space-between', color: 'paper', bg: 'linear-gradient(to bottom, rgba(8,9,11,.98), rgba(8,9,11,.72), transparent)'})}>
        <button aria-label={t('common.openMenu')} onClick={() => setMenuOpen(true)} className={css({border: 0, bg: 'transparent', color: 'paper', p: 2})}><Menu/></button>
        <Link href="/" aria-label="Memorabilia — početna" className={wordmark}>MEMORABILIA<span aria-hidden="true" className={css({color: 'signal'})}>.</span></Link>
        <div className={hstack({gap: 0})}>
          <button disabled={!mounted} aria-label={themeLabel} onClick={() => setTheme(darkTheme ? 'light' : 'dark')} className={cx(button({variant: 'ghost', size: 'sm'}), css({colorPalette: 'gray', border: 0, bg: 'transparent', color: 'paper', p: 2}))}>{darkTheme ? <Sun/> : <Moon/>}</button>
          <button aria-label={t('common.search')} onClick={() => setSearchOpen(true)} className={cx(button({variant: 'ghost', size: 'sm'}), css({colorPalette: 'gray', border: 0, bg: 'transparent', color: 'paper', p: 2}))}><Search/></button>
        </div>
      </header>

      <main className={css({ml: {base: 0, lg: '15.5rem'}, minW: 0})}>{children}</main>

      {searchOpen && (
        <div className={css({position: 'fixed', inset: 0, zIndex: 80, bg: 'overlay', backdropFilter: 'blur(22px)', overflowY: 'auto'})} role="dialog" aria-modal="true" aria-label={t('common.search')}>
          <div className={css({maxW: '70rem', mx: 'auto', px: {base: 5, md: 10}, py: {base: 6, md: 12}})}>
            <div className={css({display: 'flex', alignItems: 'center', gap: 4})}>
              <Search size={26} className={css({color: 'lime', flexShrink: 0})}/>
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.searchPlaceholder')} className={css({w: '100%', border: 0, borderBottom: '1px solid var(--memorabilia-line)', bg: 'transparent', color: 'cream', fontFamily: 'display', fontWeight: 650, fontSize: {base: '2xl', md: '5xl'}, py: 3, outline: 'none', _placeholder: {color: 'muted'}})}/>
              <button onClick={() => setSearchOpen(false)} aria-label={t('common.close')} className={css({border: '1px solid var(--memorabilia-line)', bg: 'transparent', color: 'cream', w: 10, h: 10, borderRadius: 'full', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0})}><X size={18}/></button>
            </div>
            <p className={css({mt: 5, mb: 4, color: 'muted', fontSize: 'sm'})}>{results.length} / {allItems.length}</p>
            <div className={css({display: 'grid', gridTemplateColumns: {base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)'}, gap: 3})}>
              {results.map((item) => <Link key={`${item.category}-${item.slug}`} href={`/${item.category}/${item.slug}/`} onClick={() => {setSearchOpen(false); setQuery('');}} className={css({display: 'flex', gap: 3, alignItems: 'center', p: 3, borderRadius: '12px', bg: 'soft', border: '1px solid transparent', _hover: {borderColor: 'rgba(197,244,103,.6)', bg: 'hover'}})}>
                <div className={css({w: 20, aspectRatio: '16/10', borderRadius: '8px', overflow: 'hidden', bg: '#1b1e24', flexShrink: 0})}>{item.image ? <img src={`${basePath}${item.image}`} alt="" className={css({w: '100%', h: '100%', objectFit: 'cover'})}/> : null}</div>
                <span><strong className={css({display: 'block', fontSize: 'sm', lineClamp: 1})}>{item.title}</strong><small className={css({color: 'muted', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em'})}>{t(`nav.${item.category}`)}</small></span>
              </Link>)}
            </div>
            {!results.length && <p className={css({py: 20, textAlign: 'center', color: 'muted'})}>{t('common.noResults')}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
