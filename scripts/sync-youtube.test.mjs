import assert from 'node:assert/strict';
import test from 'node:test';
import {matchEntry, normalize} from './sync-youtube.mjs';

test('normalizes Croatian diacritics and video boilerplate', () => {
  assert.equal(normalize('Čupavci — CRTANI FILM (Full Episode)'), 'cupavci');
});

test('matches the longest complete archive title', () => {
  const entries = [{title: 'Tom'}, {title: 'Tom i Jerry'}];
  assert.equal(matchEntry('Tom i Jerry - epizoda 4', entries), entries[1]);
  assert.equal(matchEntry('Tomorrow Never Comes', entries), null);
});
