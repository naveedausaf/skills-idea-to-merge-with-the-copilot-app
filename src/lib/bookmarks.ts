// Pure helpers for Mona's Bookmark Manager App.
//
// Nothing in this module touches the DOM, localStorage, or any other
// browser-only API. That's what makes it safe to import both from the
// client-side <script> in src/components/Bookmarks.astro AND from plain
// Node.js unit tests (see tests/bookmarks.test.ts) with no browser required.

export const STORAGE_KEY = 'mona-bookmarks';

export interface Bookmark {
  url: string;
  slug: string;
}

const BASE62_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Normalise a user-typed URL so that equivalent inputs (with or without a
 * scheme) end up saved as the exact same string.
 *
 * Returns null when the input can't be turned into a usable http(s) URL.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Generate a short "mona-" prefixed base62 slug. Pass the set of slugs
 * already in use to avoid collisions; a fresh random slug is drawn until a
 * unique one is found.
 */
export function generateSlug(existingSlugs: ReadonlySet<string> = new Set()): string {
  let slug: string;
  do {
    let body = '';
    for (let i = 0; i < 4; i++) {
      body += BASE62_ALPHABET[Math.floor(Math.random() * BASE62_ALPHABET.length)];
    }
    slug = `mona-${body}`;
  } while (existingSlugs.has(slug));
  return slug;
}

/** True when value looks like a well-formed {url, slug} bookmark. */
function isValidBookmark(value: unknown): value is Bookmark {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.url === 'string' &&
    candidate.url.length > 0 &&
    typeof candidate.slug === 'string' &&
    candidate.slug.length > 0
  );
}

/**
 * Parse and validate a raw (untrusted) value read from localStorage.
 *
 * Handles empty/missing values, corrupted JSON, legacy shapes, and
 * non-array values by dropping anything that doesn't match the expected
 * {url, slug} shape — this function never throws.
 */
export function parseStoredBookmarks(raw: string | null | undefined): Bookmark[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isValidBookmark).map((b) => ({ url: b.url, slug: b.slug }));
}

/** Serialize bookmarks for storage. */
export function serializeBookmarks(bookmarks: readonly Bookmark[]): string {
  return JSON.stringify(bookmarks);
}

/** Render a single bookmark using the required " :: " separator. */
export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url} :: ${bookmark.slug}`;
}
