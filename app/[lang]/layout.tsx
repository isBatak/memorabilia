import '../globals.css';
import {locales} from '../../lib/i18n';
import {RootDocument, rootMetadata, rootViewport} from '../root-document';

export const metadata = rootMetadata;
export const viewport = rootViewport;
export function generateStaticParams() {
  return locales.map((lang) => ({lang}));
}

export default RootDocument;
