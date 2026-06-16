/**
 * rules.ts
 * ---------------------------------------------------------------------------
 * Connected-speech (sandhi) rules for General American English. Each rule
 * mutates the `phones` arrays of the {@link TranscribedWord} list in place.
 * Deleted segments become '' (kept as placeholders so indices stay valid) and
 * are filtered out at render time.
 *
 * Rules run in an order that respects how the processes feed each other:
 *   yod-coalescence → elision → assimilation → glottalization
 *   → degemination → flapping → linking glides
 *
 * Cross-word rules never apply across a clause/sentence break (`breakAfter`).
 */

import {
  base,
  isConsonant,
  isStress,
  isVowel,
  BILABIAL,
  VELAR,
  FRONT_GLIDE_VOWELS,
  BACK_GLIDE_VOWELS,
  FLAP_LEFT_CONTEXT,
} from './phonemes';
import type { RuleFlags, TranscribedWord } from './types';

interface Real {
  /** Index into the word's `phones` array. */
  i: number;
  /** Base symbol (length mark stripped). */
  s: string;
}

function firstReal(word: TranscribedWord): Real | null {
  const p = word.phones;
  for (let i = 0; i < p.length; i++) {
    if (p[i] !== '' && !isStress(p[i])) return { i, s: base(p[i]) };
  }
  return null;
}

function lastReal(word: TranscribedWord): Real | null {
  const p = word.phones;
  for (let i = p.length - 1; i >= 0; i--) {
    if (p[i] !== '' && !isStress(p[i])) return { i, s: base(p[i]) };
  }
  return null;
}

function prevRealInWord(word: TranscribedWord, idx: number): Real | null {
  const p = word.phones;
  for (let i = idx - 1; i >= 0; i--) {
    if (p[i] !== '' && !isStress(p[i])) return { i, s: base(p[i]) };
  }
  return null;
}

function nextRealInWord(word: TranscribedWord, idx: number): Real | null {
  const p = word.phones;
  for (let i = idx + 1; i < p.length; i++) {
    if (p[i] !== '' && !isStress(p[i])) return { i, s: base(p[i]) };
  }
  return null;
}

/** Iterate adjacent word pairs that are not separated by a clause break. */
function eachBoundary(
  words: TranscribedWord[],
  fn: (a: TranscribedWord, b: TranscribedWord) => void,
): void {
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].breakAfter) continue;
    fn(words[i], words[i + 1]);
  }
}

/* ---------------------------------------------------------------------- */
/* Individual rules                                                        */
/* ---------------------------------------------------------------------- */

/** /t,d,s,z/ + /j/ → /tʃ,dʒ,ʃ,ʒ/ across a word boundary (did you → dɪdʒu). */
function yodCoalescence(words: TranscribedWord[]): void {
  const map: Record<string, string> = { t: 'tʃ', d: 'dʒ', s: 'ʃ', z: 'ʒ' };
  eachBoundary(words, (a, b) => {
    const left = lastReal(a);
    const right = firstReal(b);
    if (!left || !right || right.s !== 'j') return;
    const merged = map[left.s];
    if (!merged) return;
    a.phones[left.i] = merged;
    b.phones[right.i] = ''; // the /j/ is absorbed
  });
}

/** Drop word-final /t,d/ caught between two consonants (last night → lɑs naɪt). */
function elision(words: TranscribedWord[]): void {
  eachBoundary(words, (a, b) => {
    const left = lastReal(a);
    if (!left || (left.s !== 't' && left.s !== 'd')) return;
    const before = prevRealInWord(a, left.i);
    const after = firstReal(b);
    if (before && after && isConsonant(before.s) && isConsonant(after.s)) {
      a.phones[left.i] = '';
    }
  });
}

/** Regressive place assimilation of word-final /n,t,d,s,z/. */
function assimilation(words: TranscribedWord[], flags: RuleFlags): void {
  eachBoundary(words, (a, b) => {
    const left = lastReal(a);
    const right = firstReal(b);
    if (!left || !right) return;
    const nb = right.s;
    let rep: string | null = null;
    switch (left.s) {
      case 'n':
        if (BILABIAL.has(nb)) rep = 'm';
        else if (VELAR.has(nb)) rep = 'ŋ';
        break;
      case 'd':
        if (BILABIAL.has(nb)) rep = 'b';
        else if (VELAR.has(nb)) rep = 'ɡ';
        break;
      case 't':
        // When glottalization is on it takes precedence for /t/ before a
        // consonant, so we leave /t/ alone here and let it become [ʔ].
        if (!flags.glottalization) {
          if (BILABIAL.has(nb)) rep = 'p';
          else if (VELAR.has(nb)) rep = 'k';
        }
        break;
      case 's':
        if (nb === 'ʃ' || nb === 'j') rep = 'ʃ';
        break;
      case 'z':
        if (nb === 'ʃ' || nb === 'j') rep = 'ʒ';
        break;
    }
    if (rep) a.phones[left.i] = rep;
  });
}

/** Word-final /t/ → [ʔ] before a consonant or a pause (that one → ðæʔ wʌn). */
function glottalization(words: TranscribedWord[]): void {
  for (let i = 0; i < words.length; i++) {
    const left = lastReal(words[i]);
    if (!left || left.s !== 't') continue;
    const before = prevRealInWord(words[i], left.i);
    if (!before || !isVowel(before.s)) continue; // only after a vowel
    const atBreak = words[i].breakAfter || i === words.length - 1;
    const after = atBreak ? null : firstReal(words[i + 1]);
    const beforeConsonantOrPause = after ? isConsonant(after.s) : true;
    if (beforeConsonantOrPause) words[i].phones[left.i] = 'ʔ';
  }
}

/** Collapse identical consonants across a boundary (big game → bɪɡeɪm). */
function degemination(words: TranscribedWord[]): void {
  eachBoundary(words, (a, b) => {
    const left = lastReal(a);
    const right = firstReal(b);
    if (!left || !right) return;
    if (left.s === right.s && isConsonant(left.s)) {
      a.phones[left.i] = left.s + 'ː'; // mark a single, lengthened consonant
      b.phones[right.i] = '';
    }
  });
}

/** /t,d/ → [ɾ] between vowels, within a word and across boundaries. */
function flapping(words: TranscribedWord[]): void {
  const n = words.length;
  for (let w = 0; w < n; w++) {
    const p = words[w].phones;
    for (let i = 0; i < p.length; i++) {
      const b = base(p[i]);
      if (b !== 't' && b !== 'd') continue;

      // A stress mark immediately before means this is the onset of a stressed
      // syllable (e.g. aˈttack) — no flapping there.
      let j = i - 1;
      while (j >= 0 && p[j] === '') j--;
      if (j >= 0 && isStress(p[j])) continue;

      // The left (vowel) context must be inside the SAME word: we flap a
      // word-final or word-internal /t,d/, but never a word-initial /t,d/ of
      // the following word — e.g. "to do" stays [tə du], not [tə ɾu].
      const leftIn = prevRealInWord(words[w], i);
      const leftSym = leftIn ? leftIn.s : null;

      const rightIn = nextRealInWord(words[w], i);
      const rightSym = rightIn
        ? rightIn.s
        : w < n - 1 && !words[w].breakAfter
          ? firstReal(words[w + 1])?.s ?? null
          : null;

      if (leftSym && rightSym && FLAP_LEFT_CONTEXT.has(leftSym) && isVowel(rightSym)) {
        p[i] = 'ɾ';
      }
    }
  }
}

/** Insert a linking /j/ or /w/ between two vowels (I am → aɪ jæm, go on → ɡoʊ wɑn). */
function linking(words: TranscribedWord[]): void {
  eachBoundary(words, (a, b) => {
    const left = lastReal(a);
    const right = firstReal(b);
    if (!left || !right || !isVowel(left.s) || !isVowel(right.s)) return;
    let glide: string | null = null;
    if (FRONT_GLIDE_VOWELS.has(left.s)) glide = 'j';
    else if (BACK_GLIDE_VOWELS.has(left.s)) glide = 'w';
    if (glide) b.phones.splice(right.i, 0, glide);
  });
}

/* ---------------------------------------------------------------------- */
/* Orchestrator                                                            */
/* ---------------------------------------------------------------------- */

/** Apply every enabled connected-speech rule, in the correct feeding order. */
export function applyConnectedSpeech(words: TranscribedWord[], flags: RuleFlags): void {
  if (flags.yodCoalescence) yodCoalescence(words);
  if (flags.elision) elision(words);
  if (flags.assimilation) assimilation(words, flags);
  if (flags.glottalization) glottalization(words);
  if (flags.degemination) degemination(words);
  if (flags.flapping) flapping(words);
  if (flags.linking) linking(words);
}
