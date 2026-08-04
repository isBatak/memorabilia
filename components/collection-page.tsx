'use client';

import {useCallback, useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Search} from 'lucide-react';
import {css} from '#styled-system/css';
import {ArchiveBadge} from './archive-badge';
import {MediaCard} from './media-card';
import type {ArchiveCard, Category} from '../lib/archive';

const normalizeSearch = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('hr');

type CollectionState = {query: string; scrollY: number};
const collectionState = new Map<Category, CollectionState>();

export function CollectionPage({category, items}: {category: Category; items: ArchiveCard[]}) {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [restored, setRestored] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const queryRef = useRef(query);
  const storageKey = `memorabilia:collection:${category}`;

  const filteredItems = useMemo(() => {
    const normalized = normalizeSearch(deferredQuery.trim());
    if (!normalized) return items;
    return items.filter((item) => normalizeSearch(`${item.title} ${item.summary}`).includes(normalized));
  }, [deferredQuery, items]);

  const saveState = useCallback((scrollY = window.scrollY) => {
    const state = {query: queryRef.current, scrollY};
    collectionState.set(category, state);
    window.sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [category, storageKey]);

  useEffect(() => {
    queryRef.current = query;
    if (restored) saveState();
  }, [query, restored, saveState]);

  useEffect(() => {
    let saved: Partial<CollectionState> = collectionState.get(category) || {};
    if (!collectionState.has(category)) {
      try {
        saved = JSON.parse(window.sessionStorage.getItem(storageKey) || '{}');
      } catch {
        window.sessionStorage.removeItem(storageKey);
      }
    }
    const savedQuery = typeof saved.query === 'string' ? saved.query : '';
    const savedScroll = typeof saved.scrollY === 'number' ? saved.scrollY : 0;
    queryRef.current = savedQuery;
    setQuery(savedQuery);
    let secondFrame = 0;
    let settleTimer = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        window.scrollTo({top: savedScroll});
        settleTimer = window.setTimeout(() => {
          window.scrollTo({top: savedScroll});
          setRestored(true);
        }, 150);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(settleTimer);
    };
  }, [category, storageKey]);

  return (
    <section className={css({minH: '100vh', px: {base: 5, md: 9}, pt: {base: 24, lg: 12}, pb: {base: 14, md: 20}})}>
      <header className={css({maxW: '64rem', mb: {base: 8, md: 10}})}>
        <ArchiveBadge className={css({mb: 5})}>{t('collection.eyebrow')}</ArchiveBadge>
        <div className={css({display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 3})}>
          <h1 className={css({fontFamily: 'display', fontSize: {base: '4xl', md: '6xl'}, fontWeight: 750, lineHeight: .95, letterSpacing: '-.055em'})}>{t(`nav.${category}`)}</h1>
          <span className={css({color: 'gray.500', fontSize: 'sm', fontWeight: 750})}>{items.length.toString().padStart(2, '0')}</span>
        </div>
        <p className={css({maxW: '42rem', mt: 5, color: 'gray.600', fontSize: {base: 'sm', md: 'md'}, lineHeight: 1.7, _dark: {color: 'gray.400'}})}>{t(`collection.${category}`)}</p>
      </header>

      <div className={css({position: 'relative', maxW: '48rem', mb: 8})}>
        <Search aria-hidden="true" size={20} className={css({position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', color: 'gray.500', pointerEvents: 'none'})}/>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('collection.searchPlaceholder')}
          aria-label={t('collection.searchPlaceholder')}
          className={css({
            w: '100%',
            h: '3.25rem',
            pl: 12,
            pr: 4,
            border: '1px solid',
            borderColor: 'gray.300',
            borderRadius: '14px',
            bg: 'white',
            color: 'gray.950',
            fontSize: 'md',
            outline: 'none',
            boxShadow: '0 10px 30px token(colors.black/6)',
            transition: 'border-color .2s, box-shadow .2s',
            _focus: {borderColor: 'lime.500', boxShadow: '0 0 0 3px token(colors.lime.300/20), 0 12px 34px token(colors.black/8)'},
            _placeholder: {color: 'gray.500'},
            _dark: {borderColor: 'gray.700', bg: 'gray.950', color: 'gray.50', boxShadow: '0 12px 34px token(colors.black/30)', _focus: {borderColor: 'lime.500'}}
          })}
        />
      </div>

      <div className={css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, color: 'gray.600', fontSize: 'xs', _dark: {color: 'gray.400'}})} aria-live="polite">
        <span>{t('collection.showing')}</span>
        <strong>{filteredItems.length} / {items.length}</strong>
      </div>

      {filteredItems.length ? (
        <div data-collection-grid className={css({display: 'grid', gridTemplateColumns: {base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))'}, gap: {base: 4, md: 5}})}>
          {filteredItems.map((item, index) => (
            <MediaCard key={item.slug} item={item} layout="grid" priority={index < 8} onNavigate={() => saveState()}/>
          ))}
        </div>
      ) : (
        <p className={css({py: 20, textAlign: 'center', color: 'gray.600', _dark: {color: 'gray.400'}})}>{t('common.noResults')}</p>
      )}
    </section>
  );
}
