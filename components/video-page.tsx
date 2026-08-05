import Link from 'next/link';
import {ArrowLeft, ExternalLink} from 'lucide-react';
import {css} from '#styled-system/css';
import type {ArchiveEntry, ArchiveVideo} from '../lib/archive';
import {localizedPath, type Locale} from '../lib/i18n';
import {videoMorph, videoTransitionName} from './video-transition';

export function VideoPage({entry, video, locale}: {entry: ArchiveEntry; video: ArchiveVideo; locale: Locale}) {
  return (
    <section className={css({position: 'fixed', inset: 0, zIndex: 30, w: '100vw', h: '100dvh', minH: '100vh', overflow: 'hidden', bg: 'black', color: 'white', isolation: 'isolate', visibility: 'visible', opacity: 1})}>
      <div
        style={{viewTransitionName: videoTransitionName(video.id)}}
        className={css({viewTransitionClass: videoMorph, position: 'absolute', inset: 0, bg: 'black'})}
      >
        <iframe
          src={video.embedUrl}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className={css({display: 'block', w: '100%', h: '100%', border: 0})}
        />
      </div>

      <nav
        aria-label="Video navigation"
        className={css({
          position: 'absolute',
          zIndex: 2,
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 4,
          px: {base: 4, md: 7},
          pt: {base: 4, md: 7},
          pb: {base: 12, md: 20},
          bg: 'linear-gradient(to bottom, token(colors.black/92) 0%, token(colors.black/48) 52%, transparent 100%)',
          opacity: {base: 1, lg: .72},
          transition: 'opacity .25s ease, filter .25s ease',
          filter: 'drop-shadow(0 16px 24px token(colors.black/32))',
          pointerEvents: 'none',
          _hover: {opacity: 1, filter: 'drop-shadow(0 20px 34px token(colors.black/62))'},
          _focusWithin: {opacity: 1, filter: 'drop-shadow(0 20px 34px token(colors.black/62))'}
        })}
      >
        <Link
          href={localizedPath(locale, `/${entry.category}/${entry.slug}/`)}
          transitionTypes={['close-video']}
          className={css({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            minW: 0,
            px: 3,
            py: 2.5,
            borderRadius: 'full',
            bg: 'black/42',
            color: 'white',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 28px token(colors.black/38), inset 0 0 0 1px token(colors.white/12)',
            transition: 'background .2s, box-shadow .2s, transform .2s',
            pointerEvents: 'auto',
            _hover: {bg: 'black/76', boxShadow: '0 12px 36px token(colors.black/60), inset 0 0 0 1px token(colors.lime.300/55)', transform: 'translateY(-1px)'},
            _focusVisible: {outline: '2px solid', outlineColor: 'lime.300', outlineOffset: '3px'}
          })}
        >
          <ArrowLeft size={18}/>
          <span className={css({minW: 0})}>
            <strong className={css({display: 'block', maxW: {base: '56vw', md: '34rem'}, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'sm', textShadow: '0 2px 12px token(colors.black)'})}>{entry.title}</strong>
            <small className={css({display: {base: 'none', sm: 'block'}, maxW: '34rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white/66', fontSize: '10px', letterSpacing: '.02em'})}>{video.title}</small>
          </span>
        </Link>

        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className={css({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
            px: 3,
            py: 2.5,
            borderRadius: 'full',
            bg: 'black/42',
            color: 'white/78',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 28px token(colors.black/38), inset 0 0 0 1px token(colors.white/12)',
            fontSize: 'xs',
            fontWeight: 750,
            pointerEvents: 'auto',
            transition: 'color .2s, background .2s, box-shadow .2s, transform .2s',
            _hover: {bg: 'black/76', color: 'lime.200', boxShadow: '0 12px 36px token(colors.black/60), inset 0 0 0 1px token(colors.lime.300/55)', transform: 'translateY(-1px)'},
            _focusVisible: {outline: '2px solid', outlineColor: 'lime.300', outlineOffset: '3px'}
          })}
        >
          <span className={css({display: {base: 'none', sm: 'inline'}})}>{video.source.name || video.source.type}</span>
          <ExternalLink size={15}/>
        </a>
      </nav>
    </section>
  );
}
