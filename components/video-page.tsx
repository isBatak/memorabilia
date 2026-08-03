'use client';

import Link from 'next/link';
import {ArrowLeft, ExternalLink} from 'lucide-react';
import {css} from '#styled-system/css';
import type {ArchiveEntry, YouTubeVideo} from '../lib/archive';
import {videoMorph, videoTransitionName} from './video-transition';

export function VideoPage({entry, video}: {entry: ArchiveEntry; video: YouTubeVideo}) {
  return <main className={css({minH: '100vh', bg: 'black', color: 'white'})}>
    <div className={css({position: 'relative', w: '100%', minH: {base: '100vh', lg: 'calc(100vh - 2rem)'}, display: 'grid', gridTemplateRows: 'auto 1fr auto', bg: 'radial-gradient(circle at 50% 35%, token(colors.gray.900), token(colors.black) 68%)'})}>
      <header className={css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, px: {base: 4, md: 8}, py: 5, zIndex: 2})}>
        <Link transitionTypes={['close-video']} href={`/${entry.category}/${entry.slug}`} className={css({display: 'inline-flex', alignItems: 'center', gap: 2, color: 'gray.300', fontSize: 'sm', _hover: {color: 'white'}})}><ArrowLeft size={18}/> {entry.title}</Link>
        <a href={video.url} target="_blank" rel="noreferrer" className={css({display: 'inline-flex', alignItems: 'center', gap: 2, color: 'gray.400', fontSize: 'xs', _hover: {color: 'red.400'}})}>YouTube <ExternalLink size={14}/></a>
      </header>
      <div className={css({w: '100%', maxW: '90rem', m: 'auto', px: {base: 0, md: 8}, alignSelf: 'center'})}>
        <div style={{viewTransitionName: videoTransitionName(video.videoId)}} className={css({viewTransitionClass: videoMorph, position: 'relative', aspectRatio: '16/9', overflow: 'hidden', bg: 'gray.950', boxShadow: '0 30px 100px token(colors.black)'})}>
          <iframe src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className={css({position: 'absolute', inset: 0, w: '100%', h: '100%', border: 0})}/>
        </div>
      </div>
      <div className={css({px: {base: 5, md: 8}, py: {base: 7, md: 8}, maxW: '90rem', w: '100%', mx: 'auto'})}>
        <p className={css({color: 'red.400', fontSize: 'xs', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 2})}>{video.sourceName || 'YouTube'}</p>
        <h1 className={css({fontFamily: 'display', fontSize: {base: '2xl', md: '4xl'}, letterSpacing: '-.035em'})}>{video.title}</h1>
        {video.publishedText && <p className={css({color: 'gray.500', fontSize: 'sm', mt: 2})}>{video.publishedText}</p>}
      </div>
    </div>
  </main>;
}
