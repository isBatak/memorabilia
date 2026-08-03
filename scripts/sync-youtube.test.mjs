import test from 'node:test';
import assert from 'node:assert/strict';
import {matchEntry, normalize, videoFromNode} from './sync-youtube.mjs';

test('normalizes titles', () => assert.equal(normalize('Čupavci — crtani film'), 'cupavci'));

test('matches longest title', () => assert.equal(
  matchEntry('Tom i Jerry epizoda', [{title: 'Tom'}, {title: 'Tom i Jerry'}]).title,
  'Tom i Jerry'
));

test('reads the current YouTube lockup renderer', () => {
  const source = {name: 'Test', url: 'https://youtube.example/videos'};
  const node = {
    lockupViewModel: {
      contentId: 'abc123',
      contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
      metadata: {
        lockupMetadataViewModel: {
          title: {content: 'Barney epizoda 1'},
          metadata: {
            contentMetadataViewModel: {
              metadataRows: [{metadataParts: [
                {text: {content: '12 pregleda'}},
                {text: {content: 'prije 2 dana'}}
              ]}]
            }
          }
        }
      },
      contentImage: {
        thumbnailViewModel: {
          overlays: [{thumbnailBottomOverlayViewModel: {
            badges: [{thumbnailBadgeViewModel: {text: '8:11'}}]
          }}]
        }
      }
    }
  };

  assert.deepEqual(videoFromNode(node, source), {
    id: 'abc123',
    title: 'Barney epizoda 1',
    url: 'https://www.youtube.com/watch?v=abc123',
    embedUrl: 'https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0',
    thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
    durationText: '8:11',
    publishedText: 'prije 2 dana',
    source: {type: 'youtube', name: 'Test', url: 'https://youtube.example/videos'}
  });
});
