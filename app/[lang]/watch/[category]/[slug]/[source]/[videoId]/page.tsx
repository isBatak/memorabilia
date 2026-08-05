import {notFound} from 'next/navigation';
import {VideoPage} from '../../../../../../../components/video-page';
import {categories, getAllVideoParams, getEntry, type Category} from '../../../../../../../lib/archive';
import {isLocale} from '../../../../../../../lib/i18n';

export const dynamicParams = false;

export async function generateStaticParams({params}: {params: {category: string}}) {
  const {category} = params;
  return getAllVideoParams()
    .filter((params) => params.category === category)
    .map(({slug, source, videoId}) => ({slug, source, videoId}));
}

export default async function Page({params}: PageProps<'/[lang]/watch/[category]/[slug]/[source]/[videoId]'>) {
  const {lang, category, slug, source, videoId} = await params;
  if (!isLocale(lang)) notFound();
  if (!categories.includes(category as Category)) notFound();
  const entry = getEntry(category as Category, slug);
  const video = entry?.videos?.find((video) => video.id === videoId && video.source.type === source);
  if (!entry || !video) notFound();
  return <VideoPage entry={entry} video={video} locale={lang}/>;
}
