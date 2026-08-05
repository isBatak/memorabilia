import {getAllVideoParams} from '../../../../lib/archive';

export const dynamicParams = false;

export function generateStaticParams() {
  return [...new Set(getAllVideoParams().map(({category}) => category))]
    .map((category) => ({category}));
}

export default function WatchCategoryLayout({children}: LayoutProps<'/[lang]/watch/[category]'>) {
  return children;
}
