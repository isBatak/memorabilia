import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {CollectionPage} from '../../components/collection-page';
import {categories, getArchiveIndex, type Category} from '../../lib/archive';

export const dynamicParams = false;

const titles: Record<Category, string> = {
  cartoons: 'Crtani filmovi',
  series: 'Serije',
  movies: 'Filmovi'
};

export function generateStaticParams() {
  return categories.map((category) => ({category}));
}

export async function generateMetadata({params}: {params: Promise<{category: string}>}): Promise<Metadata> {
  const {category} = await params;
  if (!categories.includes(category as Category)) return {};
  return {title: titles[category as Category]};
}

export default async function Page({params}: {params: Promise<{category: string}>}) {
  const {category} = await params;
  if (!categories.includes(category as Category)) notFound();
  const {collections} = getArchiveIndex();
  const items = [...collections[category as Category]].sort((a, b) => a.title.localeCompare(b.title, 'hr'));
  return <CollectionPage category={category as Category} items={items}/>;
}
