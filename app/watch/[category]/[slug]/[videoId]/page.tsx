import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {VideoPage} from '../../../../../components/video-page';
import {categories, getAllVideoParams, getEntry, type Category} from '../../../../../lib/archive';

export const dynamicParams = false;

export function generateStaticParams() { return getAllVideoParams(); }

export async function generateMetadata({params}: {params: Promise<{category: string; slug: string; videoId: string}>}): Promise<Metadata> {
  const {category, slug, videoId} = await params;
  if (!categories.includes(category as Category)) return {};
  const entry = getEntry(category as Category, slug);
  const video = entry?.youtubeVideos?.find((item) => item.videoId === videoId);
  return video ? {title: `${video.title} — ${entry?.title}`} : {};
}

export default async function Page({params}: {params: Promise<{category: string; slug: string; videoId: string}>}) {
  const {category, slug, videoId} = await params;
  if (!categories.includes(category as Category)) notFound();
  const entry = getEntry(category as Category, slug);
  const video = entry?.youtubeVideos?.find((item) => item.videoId === videoId);
  if (!entry || !video) notFound();
  return <VideoPage entry={entry} video={video}/>;
}
