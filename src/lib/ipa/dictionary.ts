/**
 * dictionary.ts
 * ---------------------------------------------------------------------------
 * Loads and parses the pronunciation dataset. Two formats are auto-detected:
 *
 *  1. Lightweight TSV (preferred, native ipa-dict "en_US" format):
 *         word<TAB>/ipa/, /ipa/
 *
 *  2. JSON object:
 *         { "word": "/ipa/, /ipa/" }
 *
 * The parsed result maps a lowercased word to an array of pronunciation
 * variants (each an array of segmented phones); variant[0] is the primary.
 */

import { deslash, normalizeGlyphs, segment } from './phonemes';

export interface DictEntry {
  /** Pronunciation variants, each pre-segmented into phones. variants[0] is primary. */
  variants: string[][];
  /** Raw IPA strings (with slashes removed) for display, primary first. */
  raw: string[];
}

export type Dictionary = Map<string, DictEntry>;

/** Split a raw value like `/a/, /b/` into individual IPA strings. */
function splitVariants(value: string): string[] {
  return value
    .split(',')
    .map((v) => deslash(v))
    .filter((v) => v.length > 0);
}

function addEntry(dict: Dictionary, key: string, value: string): void {
  const word = key.trim().toLowerCase();
  if (!word) return;
  const rawVariants = splitVariants(value);
  if (!rawVariants.length) return;
  dict.set(word, {
    raw: rawVariants.map((v) => normalizeGlyphs(v)),
    variants: rawVariants.map((v) => segment(v)),
  });
}

/** Parse a dataset string (TSV or JSON, auto-detected) into a {@link Dictionary}. */
export function parseDictionary(text: string): Dictionary {
  const dict: Dictionary = new Map();
  const trimmed = text.trimStart();

  if (trimmed.startsWith('{')) {
    const obj = JSON.parse(trimmed) as Record<string, string>;
    for (const [key, value] of Object.entries(obj)) {
      addEntry(dict, key, String(value));
    }
    return dict;
  }

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const tab = line.indexOf('\t');
    if (tab >= 0) {
      addEntry(dict, line.slice(0, tab), line.slice(tab + 1));
    } else {
      // Fallback: first whitespace-run separates the headword from the IPA.
      const m = line.match(/^(\S+)\s+(.*)$/);
      if (m) addEntry(dict, m[1], m[2]);
    }
  }
  return dict;
}

/**
 * Look a word up, trying a few light normalisations:
 *  - exact (lowercased)
 *  - apostrophes removed (e.g. "don't" → "dont")
 *  - curly apostrophe normalised to straight
 */
export function lookup(dict: Dictionary, word: string): DictEntry | null {
  const lower = word.toLowerCase();
  const candidates = [
    lower,
    lower.replace(/\u2019/g, "'"),
    lower.replace(/['\u2019]/g, ''),
  ];
  for (const c of candidates) {
    const hit = dict.get(c);
    if (hit) return hit;
  }
  return null;
}

/**
 * Fetch and parse the dataset from the public folder. Tries `dictionary.txt`
 * first (lighter), then falls back to `dictionary.json`.
 */
export async function loadDictionary(): Promise<Dictionary> {
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  const sources = [`${base}dictionary.txt`, `${base}dictionary.json`];
  let lastError: unknown = null;
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`${url} → HTTP ${res.status}`);
        continue;
      }
      return parseDictionary(await res.text());
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('No dictionary source could be loaded.');
}
