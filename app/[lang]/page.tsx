import {HomePage} from '../../components/home-page';
import {getArchiveIndex} from '../../lib/archive';

export default function Page() {
  const archive = getArchiveIndex();
  return <HomePage {...archive}/>;
}
