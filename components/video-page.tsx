'use client';
import Link from 'next/link';
import {ArrowLeft, ExternalLink} from 'lucide-react';
import {css} from '#styled-system/css';
import type {ArchiveEntry, ArchiveVideo} from '../lib/archive';
import {videoMorph, videoTransitionName} from './video-transition';
export function VideoPage({entry, video}: {entry: ArchiveEntry; video: ArchiveVideo}) { return <main className={css({minH:'100vh',bg:'black',color:'white',p:{base:4,md:8}})}><header className={css({display:'flex',justifyContent:'space-between',mb:6})}><Link href={`/${entry.category}/${entry.slug}`} transitionTypes={['close-video']}><ArrowLeft/> {entry.title}</Link><a href={video.url} target="_blank" rel="noreferrer">{video.source.name || video.source.type} <ExternalLink size={14}/></a></header><div style={{viewTransitionName:videoTransitionName(video.id)}} className={css({viewTransitionClass:videoMorph,aspectRatio:'16/9',maxW:'90rem',mx:'auto',bg:'gray.950'})}><iframe src={video.embedUrl} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className={css({w:'100%',h:'100%',border:0})}/></div><h1 className={css({maxW:'90rem',mx:'auto',mt:6,fontFamily:'display',fontSize:{base:'2xl',md:'4xl'}})}>{video.title}</h1></main> }
