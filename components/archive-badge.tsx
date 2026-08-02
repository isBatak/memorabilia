import type {ReactNode} from 'react';
import {css, cx} from '#styled-system/css';

const badgeClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  px: 3,
  py: 1.5,
  border: '1px solid',
  borderColor: 'lime.300/24',
  borderRadius: 'full',
  bg: 'black/38',
  color: 'lime.300',
  backdropFilter: 'blur(10px)',
  fontSize: 'xs',
  fontWeight: 850,
  letterSpacing: '.15em',
  lineHeight: 1,
  textTransform: 'uppercase'
});

export function ArchiveBadge({children, className}: {children: ReactNode; className?: string}) {
  return <span className={cx(badgeClass, className)}>{children}</span>;
}
