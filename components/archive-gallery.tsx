'use client';

import {Dialog} from '@ark-ui/react/dialog';
import {Portal} from '@ark-ui/react/portal';
import {X} from 'lucide-react';
import {css, cx} from '#styled-system/css';
import {ArchiveBadge} from './archive-badge';
import type {ArchiveImage} from '../lib/archive';

const galleryFrame = css({
  position: 'relative',
  display: 'block',
  w: '100%',
  minW: 0,
  aspectRatio: '4/3',
  p: 0,
  textAlign: 'left',
  cursor: 'zoom-in',
  overflow: 'hidden',
  borderRadius: {base: '16px', md: '20px'},
  border: '1px solid',
  borderColor: 'gray.200',
  bg: 'gray.100',
  boxShadow: '0 10px 28px token(colors.black/8)',
  transition: 'transform .3s ease, border-color .3s ease, box-shadow .3s ease',
  _hover: {
    transform: 'translateY(-4px)',
    borderColor: 'lime.500',
    boxShadow: '0 20px 44px token(colors.black/14), 0 0 0 1px token(colors.lime.300/35)'
  },
  _dark: {
    borderColor: 'gray.800',
    bg: 'black',
    boxShadow: '0 12px 32px token(colors.black/42)',
    _hover: {
      borderColor: 'lime.500',
      boxShadow: '0 22px 50px token(colors.black/62), 0 0 0 1px token(colors.lime.500/32)'
    }
  }
});

export function ArchiveGallery({
  images,
  title,
  entryTitle,
  basePath = ''
}: {
  images: ArchiveImage[];
  title: string;
  entryTitle: string;
  basePath?: string;
}) {
  const visibleImages = images.filter((image): image is ArchiveImage & {localUrl: string} => Boolean(image.localUrl));
  if (!visibleImages.length) return null;

  return (
    <section aria-label={title} className={css({px: {base: 5, md: 9}, pb: {base: 14, md: 20}})}>
      <div className={css({display: 'flex', alignItems: 'center', gap: 2.5, mb: 4})}>
        <h2 className={css({fontFamily: 'display', fontSize: '2xl', lineHeight: 1})}>{title}</h2>
        <ArchiveBadge className={css({px: 2, py: 1, letterSpacing: '.08em'})}>
          {visibleImages.length.toString().padStart(2, '0')}
        </ArchiveBadge>
      </div>

      <div className={css({position: 'relative', maxW: '68rem'})}>
        <div className={css({position: 'relative', display: 'grid', gridTemplateColumns: {base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))'}, gap: {base: 3, md: 4}})}>
          {visibleImages.map((image, index) => {
            const label = image.alt || `${entryTitle} — ${index + 1}`;
            return (
              <Dialog.Root key={`${image.localUrl}-${index}`} lazyMount unmountOnExit>
                <Dialog.Trigger aria-label={label} className={cx('group', galleryFrame)}>
                  <span className={css({position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bg: 'radial-gradient(circle at 50% 20%, token(colors.white), token(colors.gray.100))', _dark: {bg: 'radial-gradient(circle at 50% 20%, token(colors.gray.800), token(colors.black))'}})}>
                    <img
                      src={`${basePath}${image.localUrl}`}
                      alt=""
                      loading="lazy"
                      className={css({w: '100%', h: '100%', objectFit: 'contain', transition: 'transform .45s ease', _groupHover: {transform: 'scale(1.035)'}})}
                    />
                  </span>
                </Dialog.Trigger>

                <Portal>
                  <Dialog.Backdrop className={css({position: 'fixed', inset: 0, zIndex: 90, bg: 'black/82', backdropFilter: 'blur(18px)', animationName: 'fade-in', animationDuration: 'fast'})}/>
                  <Dialog.Positioner className={css({position: 'fixed', inset: 0, zIndex: 91, display: 'grid', placeItems: 'center', p: {base: 4, md: 8}, overflowY: 'auto'})}>
                    <Dialog.Content className={css({position: 'relative', display: 'grid', placeItems: 'center', maxW: '92vw', maxH: '92vh', outline: 'none', animationName: 'scale-in, fade-in', animationDuration: 'moderate', animationTimingFunction: 'ease-out'})}>
                      <img src={`${basePath}${image.localUrl}`} alt={label} className={css({display: 'block', maxW: 'min(88vw, 80rem)', maxH: '82vh', w: 'auto', h: 'auto', objectFit: 'contain', borderRadius: {base: '14px', md: '20px'}, bg: 'black', boxShadow: '0 32px 100px token(colors.black/70), 0 0 0 1px token(colors.white/14)'})}/>
                      <Dialog.Title className={css({srOnly: true})}>{label}</Dialog.Title>
                      <Dialog.Description className={css({srOnly: true})}>{index + 1} / {visibleImages.length}</Dialog.Description>
                      <Dialog.CloseTrigger aria-label="Close" className={css({position: 'absolute', top: {base: 2, md: 0}, right: {base: 2, md: -10}, display: 'grid', placeItems: 'center', w: 8, h: 8, border: '1px solid', borderColor: 'white/24', borderRadius: 'full', bg: 'black/72', color: 'white', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'background .2s, color .2s, border-color .2s', _hover: {bg: 'lime.300', color: 'black', borderColor: 'lime.300'}})}>
                        <X size={16}/>
                      </Dialog.CloseTrigger>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Portal>
              </Dialog.Root>
            );
          })}
        </div>
      </div>
    </section>
  );
}
