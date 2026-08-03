import test from 'node:test';import assert from 'node:assert/strict';import {normalize,matchEntry} from './sync-youtube.mjs';
test('normalizes titles',()=>assert.equal(normalize('Čupavci — crtani film'),'cupavci'));
test('matches longest title',()=>assert.equal(matchEntry('Tom i Jerry epizoda',[{title:'Tom'},{title:'Tom i Jerry'}]).title,'Tom i Jerry'));
