'use client';

import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useTheme} from 'next-themes';
import {useEffect, useMemo, useState} from 'react';
import {css, cx} from '#styled-system/css';
import {button} from '#styled-system/recipes';
import {hstack} from '#styled-system/patterns';
import {Clapperboard, Film, Home, Menu, Moon, Search, Sun, Tv, X} from './icons';
import {useLocaleChoice} from './locale-provider';
import type {ArchiveCard, Category} from '../lib/archive';
import {localizedPath, type Locale} from '../lib/i18n';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const wordmark = css({
  display: 'inline-flex',
  alignItems: 'baseline',
  fontFamily: 'brand',
  fontSize: '2xl',
  lineHeight: 1,
  letterSpacing: '-.025em',
  textTransform: 'uppercase',
  textShadow: '0 2px 12px token(colors.blackAlpha.600)'
});

const navItems = [
  {key: 'home', href: '/', icon: Home},
  {key: 'cartoons', href: '/cartoons/', icon: Tv},
  {key: 'series', href: '/series/', icon: Clapperboard},
  {key: 'movies', href: '/movies/', icon: Film}
] as const;

export function AppShell({children, collections}: {children: React.ReactNode; collections: Record<Category, ArchiveCard[]>}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocaleChoice();
  const {resolvedTheme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const routeSegments = pathname.split('/').filter(Boolean);
  const watching = routeSegments[1] === 'watch';
  const activeSection = routeSegments[1] || 'home';
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

  function switchLocale(nextLocale: Locale) {
    const route = routeSegments.slice(1).join('/');
    router.replace(`/${nextLocale}/${route}${route ? '/' : ''}`);
    setMenuOpen(false);
  }

  const sidebar = css({
    position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 40, w: '15.5rem', bg: 'white/96',
    borderRight: '1px solid', borderColor: 'gray.200', px: 5, py: 6, display: 'flex', flexDirection: 'column',
    transform: {base: menuOpen ? 'translateX(0)' : 'translateX(-105%)', lg: 'none'},
    transition: 'transform .25s ease', backdropFilter: 'blur(18px)', boxShadow: '8px 0 40px token(colors.black/6)',
    _dark: {bg: 'black/96', borderColor: 'gray.800', boxShadow: '8px 0 44px token(colors.black/45)'}
  });

  return (
    <div className={css({minH: '100vh', bg: 'gray.50', color: 'gray.950', _dark: {bg: 'black', color: 'gray.50'}})}>
      {!watching && <aside className={sidebar} aria-label="Glavna navigacija">
        <Link href={localizedPath(locale)} aria-label="Memorabilia — početna" onClick={() => setMenuOpen(false)} className={cx(wordmark, css({alignSelf: 'flex-start', mb: 10, color: 'gray.950', textShadow: 'none', _dark: {color: 'gray.50'}}))}>
          MEMORABILIA<span aria-hidden="true" className={css({color: 'lime.500'})}>.</span>
        </Link>

        <nav className={css({display: 'grid', gap: 2})}>
          {navItems.map(({key, href, icon: Icon}) => {
            const active = activeSection === key;
            return (
              <Link
                key={key}
                href={localizedPath(locale, href)}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={cx(
                  css({display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2.5, borderRadius: '10px', fontSize: 'sm', fontWeight: 700, transition: 'color .2s, background .2s, transform .2s', _hover: {transform: 'translateX(2px)'}}),
                  active
                    ? css({color: 'lime.800', bg: 'lime.100', boxShadow: 'inset 3px 0 0 token(colors.lime.500)', _dark: {color: 'lime.200', bg: 'lime.900'}})
                    : css({color: 'gray.600', _hover: {color: 'gray.950', bg: 'gray.100'}, _dark: {color: 'gray.400', _hover: {color: 'gray.50', bg: 'gray.900'}}})
                )}
              >
                <Icon size={18} strokeWidth={1.8}/><span>{t(`nav.${key}`)}</span>
              </Link>
            );
          })}
        </nav>

        <button onClick={() => setSearchOpen(true)} className={cx(button({variant: 'outline', size: 'sm'}), css({mt: 7, w: '100%', justifyContent: 'flex-start', border: '1px solid', borderColor: 'gray.300', borderRadius: '12px', bg: 'white', color: 'gray.600', textAlign: 'left', _hover: {color: 'gray.950', borderColor: 'lime.500', bg: 'lime.50'}, _dark: {bg: 'gray.950', color: 'gray.400', borderColor: 'gray.700', _hover: {color: 'gray.50', borderColor: 'lime.500', bg: 'gray.900'}}}))}>
          <Search size={17}/><span className={css({fontSize: 'sm'})}>{t('common.search')}</span><kbd className={css({ml: 'auto', fontSize: '10px', border: '1px solid', borderColor: 'gray.300', px: 1.5, borderRadius: '4px', _dark: {borderColor: 'gray.700'}})}>⌘K</kbd>
        </button>

        <div className={css({mt: 'auto', display: 'grid', gap: 5})}>
          <div>
            <p className={css({color: 'gray.500', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.13em', mb: 2})}>{t('common.theme')}</p>
            <button disabled={!mounted} onClick={() => setTheme(darkTheme ? 'light' : 'dark')} aria-label={themeLabel} className={cx(button({variant: 'outline', size: 'sm'}), css({w: '100%', justifyContent: 'flex-start', border: '1px solid', borderColor: 'gray.300', bg: 'gray.50', color: 'gray.900', borderRadius: '10px', fontSize: 'xs', fontWeight: 750, _hover: {bg: 'lime.50', borderColor: 'lime.500'}, _dark: {bg: 'gray.950', color: 'gray.100', borderColor: 'gray.700', _hover: {bg: 'gray.900', borderColor: 'lime.500'}}, _disabled: {cursor: 'default'}}))}>
              {darkTheme ? <Sun size={16}/> : <Moon size={16}/>}<span>{themeLabel}</span>
            </button>
          </div>
          <div>
          <p className={css({color: 'gray.500', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.13em', mb: 2})}>{t('common.language')}</p>
          <div className={css({display: 'flex', bg: 'gray.100', p: 1, borderRadius: '10px', _dark: {bg: 'gray.900'}})}>
            {(['hr', 'en'] as const).map((code) => <button key={code} onClick={() => switchLocale(code)} className={cx(css({flex: 1, border: 0, borderRadius: '7px', py: 1.5, fontSize: 'xs', fontWeight: 800, cursor: 'pointer', transition: 'all .2s'}), locale === code ? css({bg: 'gray.950', color: 'white', boxShadow: '0 2px 8px token(colors.black/16)', _dark: {bg: 'lime.300', color: 'black'}}) : css({bg: 'transparent', color: 'gray.600', _hover: {color: 'gray.950'}, _dark: {color: 'gray.400', _hover: {color: 'gray.50'}}}))}>{code.toUpperCase()}</button>)}
          </div>
          </div>
        </div>
      </aside>}

      {!watching && menuOpen && <button aria-label={t('common.close')} onClick={() => setMenuOpen(false)} className={css({position: 'fixed', inset: 0, zIndex: 30, bg: 'blackAlpha.700', border: 0, lg: {display: 'none'}})}/>}

      {!watching && <header className={css({position: 'fixed', zIndex: 25, top: 0, left: 0, right: 0, h: 16, px: 4, display: {base: 'flex', lg: 'none'}, alignItems: 'center', justifyContent: 'space-between', color: 'gray.100', bg: 'linear-gradient(to bottom, token(colors.blackAlpha.950), token(colors.blackAlpha.700), transparent)'})}>
        <button aria-label={t('common.openMenu')} onClick={() => setMenuOpen(true)} className={css({border: 0, bg: 'transparent', color: 'gray.100', p: 2})}><Menu/></button>
        <Link href={localizedPath(locale)} aria-label="Memorabilia — početna" className={cx(wordmark, css({color: 'gray.100'}))}>MEMORABILIA<span aria-hidden="true" className={css({color: 'lime.300'})}>.</span></Link>
        <div className={hstack({gap: 0})}>
          <button disabled={!mounted} aria-label={themeLabel} onClick={() => setTheme(darkTheme ? 'light' : 'dark')} className={cx(button({variant: 'ghost', size: 'sm'}), css({colorPalette: 'gray', border: 0, bg: 'transparent', color: 'gray.100', p: 2}))}>{darkTheme ? <Sun/> : <Moon/>}</button>
          <button aria-label={t('common.search')} onClick={() => setSearchOpen(true)} className={cx(button({variant: 'ghost', size: 'sm'}), css({colorPalette: 'gray', border: 0, bg: 'transparent', color: 'gray.100', p: 2}))}><Search/></button>
        </div>
      </header>}

      <main className={css({ml: {base: 0, lg: watching ? 0 : '15.5rem'}, minW: 0})}>{children}</main>

      {searchOpen && (
        <div className={css({position: 'fixed', inset: 0, zIndex: 80, bg: 'white/94', color: 'gray.950', backdropFilter: 'blur(22px)', overflowY: 'auto', _dark: {bg: 'black/94', color: 'gray.50'}})} role="dialog" aria-modal="true" aria-label={t('common.search')}>
          <div className={css({maxW: '70rem', mx: 'auto', px: {base: 5, md: 10}, py: {base: 6, md: 12}})}>
            <div className={css({display: 'flex', alignItems: 'center', gap: 4})}>
              <Search size={26} className={css({color: 'lime.600', flexShrink: 0, _dark: {color: 'lime.300'}})}/>
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.searchPlaceholder')} className={css({w: '100%', border: 0, borderBottom: '1px solid', borderColor: 'gray.300', bg: 'transparent', color: 'gray.950', fontFamily: 'display', fontWeight: 650, fontSize: {base: '2xl', md: '5xl'}, py: 3, outline: 'none', _placeholder: {color: 'gray.500'}, _dark: {borderColor: 'gray.700', color: 'gray.50'}})}/>
              <button onClick={() => setSearchOpen(false)} aria-label={t('common.close')} className={css({border: '1px solid', borderColor: 'gray.300', bg: 'transparent', color: 'gray.950', w: 10, h: 10, borderRadius: 'full', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, _hover: {borderColor: 'lime.500', color: 'lime.700'}, _dark: {borderColor: 'gray.700', color: 'gray.50', _hover: {borderColor: 'lime.500', color: 'lime.300'}}})}><X size={18}/></button>
            </div>
            <p className={css({mt: 5, mb: 4, color: 'gray.600', fontSize: 'sm', _dark: {color: 'gray.400'}})}>{results.length} / {allItems.length}</p>
            <div className={css({display: 'grid', gridTemplateColumns: {base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)'}, gap: 3})}>
              {results.map((item) => <Link key={`${item.category}-${item.slug}`} href={localizedPath(locale, `/${item.category}/${item.slug}/`)} onClick={() => {setSearchOpen(false); setQuery('');}} className={css({display: 'flex', gap: 3, alignItems: 'center', p: 3, borderRadius: '12px', bg: 'gray.100', border: '1px solid transparent', transition: 'all .2s', _hover: {borderColor: 'lime.500', bg: 'lime.50', transform: 'translateY(-2px)'}, _dark: {bg: 'gray.900', _hover: {borderColor: 'lime.500', bg: 'gray.800'}}})}>
                <div className={css({w: 20, aspectRatio: '16/10', borderRadius: '8px', overflow: 'hidden', bg: 'gray.900', flexShrink: 0})}>{item.image ? <img src={`${basePath}${item.image}`} alt="" className={css({w: '100%', h: '100%', objectFit: 'cover'})}/> : null}</div>
                <span><strong className={css({display: 'block', fontSize: 'sm', lineClamp: 1})}>{item.title}</strong><small className={css({color: 'gray.600', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em', _dark: {color: 'gray.400'}})}>{t(`nav.${item.category}`)}</small></span>
              </Link>)}
            </div>
            {!results.length && <p className={css({py: 20, textAlign: 'center', color: 'gray.600', _dark: {color: 'gray.400'}})}>{t('common.noResults')}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
