import {notFound} from 'next/navigation';
import {category as getCategory} from 'next/root-params';
import {VideoPage} from '../../../../../../../components/video-page';
import {categories, getAllVideoParams, getEntry, type Category} from '../../../../../../../lib/archive';

export const dynamicParams = false;

export async function generateStaticParams() {
  const category = await getCategory();
  return getAllVideoParams()
    .filter((params) => params.category === category)
    .map(({slug, source, videoId}) => ({slug, source, videoId}));
}

export default async function Page({params}: {params: Promise<{slug: string; source: string; videoId: string}>}) {
  const [{slug, source, videoId}, category] = await Promise.all([params, getCategory()]);
  if (!categories.includes(category as Category)) notFound();
  const entry = getEntry(category as Category, slug);
  const video = entry?.videos?.find((video) => video.id === videoId && video.source.type === source);
  if (!entry || !video) notFound();
  return <VideoPage entry={entry} video={video}/>;
}
