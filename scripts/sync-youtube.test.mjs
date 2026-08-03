import assert from 'node:assert/strict';
import test from 'node:test';
import {linkMatchesVideo, matchEntry, normalize} from './sync-youtube.mjs';

test('normalizes Croatian diacritics and video boilerplate', () => {
  assert.equal(normalize('Čupavci — CRTANI FILM (Full Episode)'), 'cupavci');
});

test('matches the longest complete archive title', () => {
  const entries = [{title: 'Tom'}, {title: 'Tom i Jerry'}];
  assert.equal(matchEntry('Tom i Jerry - epizoda 4', entries), entries[1]);
  assert.equal(matchEntry('Tomorrow Never Comes', entries), null);
});

test('recognizes duplicate provider links despite legacy YouTube URL formatting', () => {
  const video = {id: 'dZMztkXlsMc', url: 'https://www.youtube.com/watch?v=dZMztkXlsMc', source: {type: 'youtube'}};
  assert.equal(linkMatchesVideo({url: 'http://www.youtube.com/watch?v=dZMztkXlsMc&feature=related'}, video), true);
  assert.equal(linkMatchesVideo({url: 'https://example.com/watch/dZMztkXlsMc'}, video), false);
});
