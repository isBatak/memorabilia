import {viewTransition} from '#styled-system/css';
export const videoMorph = viewTransition({group: {animationDuration: {base: '.55s', _motionReduce: '.01ms'}, animationTimingFunction: 'cubic-bezier(.22,1,.36,1)'}, imagePair: {isolation: 'isolate'}, old: {animationName: 'videoZoomOut'}, new: {animationName: 'videoZoomIn'}});
export const videoTransitionName = (id: string) => `memorabilia-video-${id}`;
