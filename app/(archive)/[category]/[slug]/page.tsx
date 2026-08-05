import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {category as getCategory} from 'next/root-params';
import {DetailPage} from '../../../../components/detail-page';
import {categories, getAllParams, getArchiveIndex, getEntry, type Category} from '../../../../lib/archive';

export const dynamicParams = false;

export async function generateStaticParams() {
  const category = await getCategory();
  return getAllParams()
    .filter((params) => params.category === category)
    .map(({slug}) => ({slug}));
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const [{slug}, category] = await Promise.all([params, getCategory()]);
  if (!categories.includes(category as Category)) return {};
  const entry = getEntry(category as Category, slug);
  return entry ? {title: entry.title, description: entry.paragraphs?.[0]?.replace(/\s+/g, ' ').slice(0, 155)} : {};
}

export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const [{slug}, category] = await Promise.all([params, getCategory()]);
  if (!categories.includes(category as Category)) notFound();
  const entry = getEntry(category as Category, slug);
  if (!entry) notFound();
  const {collections} = getArchiveIndex();
  const related = collections[category as Category].filter((item) => item.slug !== slug).sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))).slice(0, 8);
  return <DetailPage entry={entry} related={related}/>;
}
