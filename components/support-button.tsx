import {Coffee} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {css, cx} from '#styled-system/css';
import {button} from '#styled-system/recipes';

export const supportUrl = process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL;

export function SupportButton({compact = false}: {compact?: boolean}) {
  const t = useTranslations('support');

  if (!supportUrl) return null;

  return (
    <a
      href={supportUrl}
      target="_blank"
      rel="noreferrer"
      className={cx(
        button({variant: 'solid', size: compact ? 'sm' : 'md'}),
        css({
          w: compact ? '100%' : 'auto',
          justifyContent: 'center',
          borderRadius: '10px',
          bg: 'yellow.300',
          color: 'gray.950',
          fontWeight: 800,
          _hover: {bg: 'yellow.200', transform: 'translateY(-1px)'}
        })
      )}
    >
      <Coffee size={compact ? 16 : 18}/>
      {t('button')}
    </a>
  );
}
