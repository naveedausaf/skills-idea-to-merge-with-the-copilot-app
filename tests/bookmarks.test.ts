import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUrl,
  parseStoredBookmarks,
  formatBookmark,
  type Bookmark,
} from '../src/lib/bookmarks.ts';

test('normalizeUrl: adds https:// when missing and matches an explicit https:// input', () => {
  const withScheme = normalizeUrl('https://www.example.com');
  const withoutScheme = normalizeUrl('www.example.com');
  assert.equal(withoutScheme, withScheme);
  assert.equal(withScheme, 'https://www.example.com/');
});

test('normalizeUrl: trims whitespace before normalising', () => {
  assert.equal(normalizeUrl('  example.com  '), normalizeUrl('example.com'));
});

test('normalizeUrl: returns null for empty or unusable input', () => {
  assert.equal(normalizeUrl(''), null);
  assert.equal(normalizeUrl('   '), null);
  assert.equal(normalizeUrl('not a url at all'), null);
});

test('parseStoredBookmarks: empty value recovers to an empty list', () => {
  assert.deepEqual(parseStoredBookmarks(null), []);
  assert.deepEqual(parseStoredBookmarks(undefined), []);
  assert.deepEqual(parseStoredBookmarks(''), []);
});

test('parseStoredBookmarks: corrupted JSON recovers to an empty list', () => {
  assert.deepEqual(parseStoredBookmarks('{not json'), []);
  assert.deepEqual(parseStoredBookmarks('undefined'), []);
});

test('parseStoredBookmarks: legacy / non-array values recover to an empty list', () => {
  assert.deepEqual(parseStoredBookmarks('"just a string"'), []);
  assert.deepEqual(parseStoredBookmarks('42'), []);
  assert.deepEqual(parseStoredBookmarks('{"url":"https://example.com","slug":"mona-abcd"}'), []);
});

test('parseStoredBookmarks: drops malformed entries but keeps valid ones', () => {
  const raw = JSON.stringify([
    { url: 'https://example.com/', slug: 'mona-7fk2' },
    { url: 'https://missing-slug.com/' },
    { slug: 'mona-noturl' },
    null,
    'not-an-object',
    42,
    { url: 123, slug: 'mona-badtype' },
    { url: 'https://ok.example/', slug: 'mona-ok01' },
  ]);
  assert.deepEqual(parseStoredBookmarks(raw), [
    { url: 'https://example.com/', slug: 'mona-7fk2' },
    { url: 'https://ok.example/', slug: 'mona-ok01' },
  ]);
});

test('formatBookmark: uses the exact " :: " separator', () => {
  const bookmark: Bookmark = { url: 'https://www.example.com', slug: 'mona-7fk2' };
  assert.equal(formatBookmark(bookmark), 'https://www.example.com :: mona-7fk2');
});
