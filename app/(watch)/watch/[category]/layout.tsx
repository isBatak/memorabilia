import '../../../globals.css';
import {getAllVideoParams} from '../../../../lib/archive';
import {RootDocument, rootMetadata} from '../../../root-document';

export const metadata = rootMetadata;
export const dynamicParams = false;

export function generateStaticParams() {
  return [...new Set(getAllVideoParams().map(({category}) => category))]
    .map((category) => ({category}));
}

export default RootDocument;
