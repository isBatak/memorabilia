import {getArchiveIndex} from '../lib/archive';
import {HomePage} from '../components/home-page';

export default function Page() {
  const archive = getArchiveIndex();
  return <HomePage {...archive}/>;
}
