import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseVideo, matchEntry, normalize, videoFromNode} from './sync-youtube.mjs';

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

test('keeps the publishing channel from search results', () => {
  const fallback = {name: 'YouTube', url: 'https://www.youtube.com/results'};
  const video = videoFromNode({videoRenderer: {
    videoId: 'JQkOr0Ot3PI',
    title: {runs: [{text: 'Lokvići - Djedova drvarnica'}]},
    longBylineText: {runs: [{
      text: 'Classic Cartoons',
      navigationEndpoint: {browseEndpoint: {canonicalBaseUrl: '/@classiccartoons4976'}}
    }]},
    lengthText: {simpleText: '11:27'}
  }}, fallback);

  assert.equal(video.source.name, 'Classic Cartoons');
  assert.equal(video.source.url, 'https://www.youtube.com/@classiccartoons4976');
});

test('prefers Croatian episodes from the configured channel', () => {
  const ordinary = {
    id: 'ordinary', title: 'Lokvići full episode', durationText: '10:00',
    source: {type: 'youtube', name: 'Other', url: 'https://www.youtube.com/@other'}
  };
  const preferred = {
    id: 'preferred', title: 'Lokvići - epizoda sinkronizirana na hrvatski', durationText: '9:00',
    source: {type: 'youtube', name: 'Classic Cartoons', url: 'https://www.youtube.com/@classiccartoons4976'}
  };

  assert.equal(chooseVideo([ordinary, preferred], ['Lokvići'], 'primary').id, 'preferred');
});

test('does not use a movie trailer as a cartoon episode', () => {
  const trailer = {
    id: 'trailer', title: 'Bubimir | Službeni trailer | 2024', durationText: '2:00',
    source: {type: 'youtube', name: 'Studio', url: 'https://www.youtube.com/@studio'}
  };

  assert.equal(chooseVideo([trailer], ['Bubimir'], 'primary'), null);
});
