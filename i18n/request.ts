import {getRequestConfig} from 'next-intl/server';
import messages from '../messages/hr.json';

export default getRequestConfig(async () => ({
  locale: 'hr',
  messages,
  timeZone: 'Europe/Zagreb'
}));
