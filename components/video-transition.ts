import {viewTransition} from '#styled-system/css';

/** Shared Panda view-transition class for a thumbnail morphing into the player. */
export const videoMorph = viewTransition({
  group: {
    animationDuration: {base: '0.55s', _motionReduce: '0.01ms'},
    animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
  },
  imagePair: {isolation: 'isolate'},
  old: {
    animationName: 'videoZoomOut',
    animationDuration: {base: '0.4s', _motionReduce: '0.01ms'}
  },
  new: {
    animationName: 'videoZoomIn',
    animationDuration: {base: '0.55s', _motionReduce: '0.01ms'},
    animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
  }
});

export function videoTransitionName(videoId: string) {
  return `memorabilia-video-${videoId}`;
}
