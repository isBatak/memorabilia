import {categories} from '../../../lib/archive';

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({category}));
}

export default function CategoryLayout({children}: LayoutProps<'/[lang]/[category]'>) {
  return children;
}
