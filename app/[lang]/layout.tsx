import '../globals.css';
import {locales} from '../../lib/i18n';
import {RootDocument, rootMetadata} from '../root-document';

export const metadata = rootMetadata;
export function generateStaticParams() {
  return locales.map((lang) => ({lang}));
}

export default RootDocument;
