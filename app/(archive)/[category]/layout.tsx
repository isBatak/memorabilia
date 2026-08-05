import '../../globals.css';
import {categories} from '../../../lib/archive';
import {RootDocument, rootMetadata} from '../../root-document';

export const metadata = rootMetadata;
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({category}));
}

export default RootDocument;
