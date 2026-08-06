import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {DetailPage} from '../../../../components/detail-page';
import {categories, getAllParams, getArchiveIndex, getEntry, type Category} from '../../../../lib/archive';

export async function generateStaticParams({params}: {params: {category: string}}) {
  const {category} = params;
  return getAllParams()
    .filter((params) => params.category === category)
    .map(({slug}) => ({slug}));
}

export async function generateMetadata({params}: PageProps<'/[lang]/[category]/[slug]'>): Promise<Metadata> {
  const {category, slug} = await params;
  if (!categories.includes(category as Category)) return {};
  const entry = getEntry(category as Category, slug);
  return entry ? {title: entry.title, description: entry.paragraphs?.[0]?.replace(/\s+/g, ' ').slice(0, 155)} : {};
}

export default async function Page({params}: PageProps<'/[lang]/[category]/[slug]'>) {
  const {category, slug} = await params;
  if (!categories.includes(category as Category)) notFound();
  const entry = getEntry(category as Category, slug);
  if (!entry) notFound();
  const {collections} = getArchiveIndex();
  const related = collections[category as Category].filter((item) => item.slug !== slug).sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))).slice(0, 8);
  return <DetailPage entry={entry} related={related}/>;
}
