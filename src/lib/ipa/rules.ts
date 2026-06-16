/**
 * rules.ts
 * ---------------------------------------------------------------------------
 * Connected-speech (sandhi) rules for General American English. Each rule
 * mutates the `phones` arrays of the {@link TranscribedWord} list in place.
 * Deleted segments become '' (kept as placeholders so indices stay valid) and
 * are filtered out at render time.
 *
 * Rules run in an order that respects how the processes feed each other:
 *   yod-coalescence → elision → assimilation → glottalization → degemination
 *   → flapping → syllabic consonants → lateral coloring → rhotic reduction
 *   → linking glides → natural rhythm
 *
 * Cross-word rules never apply across a clause/sentence break (`breakAfter`).
 */

import {
  base,
  isConsonant,
  isNucleus,
  isStress,
  isSyllabic,
  isVowel,
  BILABIAL,
  VELAR,
  LATERAL,
  SYLLABIC_MARK,
  SYLLABIC_N_LEFT,
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

/**
 * Drop word-final /t,d/ caught between two consonants (last night → læs naɪt).
 * Coronal-stop deletion is most regular after obstruents and homorganic nasals;
 * it is unreliable after a liquid, so we keep /t,d/ after /l, r, ɹ/ — preserving
 * the /d/ in "told them", "world cup", etc.
 */
function elision(words: TranscribedWord[]): void {
  const blockers = new Set(['l', 'ɫ', 'r', 'ɹ']);
  eachBoundary(words, (a, b) => {
    const left = lastReal(a);
    if (!left || (left.s !== 't' && left.s !== 'd')) return;
    const before = prevRealInWord(a, left.i);
    const after = firstReal(b);
    if (
      before &&
      after &&
      isConsonant(before.s) &&
      !blockers.has(before.s) &&
      isConsonant(after.s)
    ) {
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

/** Symbol of the next real phone, looking across a non-broken word boundary. */
function nextSymAcross(words: TranscribedWord[], w: number, idx: number): string | null {
  const within = nextRealInWord(words[w], idx);
  if (within) return within.s;
  if (w < words.length - 1 && !words[w].breakAfter) {
    return firstReal(words[w + 1])?.s ?? null;
  }
  return null;
}

/**
 * Syllabic consonants: an unstressed /ə/ before /l/ or /n/ is absorbed and the
 * sonorant becomes syllabic — little → lɪɾl̩, bottle → bɑɾl̩, table → teɪbl̩,
 * button → bʌɾn̩. The schwa+sonorant must sit in a coda (word-final or before a
 * consonant), be preceded by a consonant, and for /n/ that consonant must be a
 * coronal (the classic environment). Runs after flapping so the flap survives.
 */
function syllabicConsonants(words: TranscribedWord[]): void {
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    const p = word.phones;
    for (let i = 0; i < p.length; i++) {
      if (base(p[i]) !== 'ə') continue;

      const son = nextRealInWord(word, i);
      if (!son) continue;
      const isLateral = LATERAL.has(son.s);
      const isNasalN = son.s === 'n';
      if (!isLateral && !isNasalN) continue;

      const prev = prevRealInWord(word, i);
      if (!prev || !isConsonant(prev.s)) continue;
      if (isNasalN && !SYLLABIC_N_LEFT.has(prev.s)) continue;

      // The sonorant must close its syllable within the word: it is word-final
      // or followed by a consonant. A vowel later in the SAME word blocks it
      // (family /fæməli/ stays), but a vowel-initial next word does not — the
      // lexicalised syllabic of little/bottle is stable ("bottle of" → bɑɾl̩ əv).
      const afterIn = nextRealInWord(word, son.i);
      if (afterIn && isVowel(afterIn.s)) continue;

      p[i] = ''; // absorb the schwa
      p[son.i] = (isLateral ? 'l' : 'n') + SYLLABIC_MARK; // l̩ / n̩
    }
  }
}

/**
 * Lateral allophony: /l/ is clear [l] in a syllable onset (immediately before a
 * vowel) and dark [ɫ] in the coda (before a consonant or pause). leave → liv,
 * feel → fiɫ, milk → mɪɫk. Syllabic [l̩] is left untouched.
 */
function lateralColoring(words: TranscribedWord[]): void {
  for (let w = 0; w < words.length; w++) {
    const p = words[w].phones;
    for (let i = 0; i < p.length; i++) {
      if (!LATERAL.has(base(p[i])) || isSyllabic(p[i])) continue;
      const nextSym = nextSymAcross(words, w, i);
      p[i] = isVowel(nextSym) ? 'l' : 'ɫ';
    }
  }
}

/**
 * Rhotic reduction: a stressed-r [ɝ] in an UNSTRESSED syllable lowers to the
 * unstressed [ɚ] — water ˈwɔtɝ → ˈwɔɾɚ, butter → ˈbʌɾɚ. A ɝ that is itself the
 * stressed nucleus (bird /bɝd/, prefer /priˈfɝ/) is preserved.
 */
function rhoticReduction(words: TranscribedWord[]): void {
  for (const word of words) {
    const p = word.phones;
    const stressedVowels = new Set<number>();
    let hasStress = false;
    for (let i = 0; i < p.length; i++) {
      if (!isStress(p[i])) continue;
      hasStress = true;
      // The stressed nucleus is the first VOWEL after the mark, skipping any
      // onset consonants (e.g. ˈwɝɫd → the nucleus is ɝ, not the onset w).
      for (let j = i + 1; j < p.length; j++) {
        if (p[j] === '' || isStress(p[j])) continue;
        if (isVowel(p[j])) {
          stressedVowels.add(j);
          break;
        }
      }
    }
    for (let i = 0; i < p.length; i++) {
      if (base(p[i]) !== 'ɝ') continue;
      if (!hasStress || stressedVowels.has(i)) continue; // stressed nucleus → keep
      p[i] = 'ɚ';
    }
  }
}

/**
 * Natural rhythm: in connected speech monosyllables don't carry a lexical
 * stress mark, so we strip ˈ/ˌ from any word with a single syllable nucleus
 * (told, put, leave → no mark). Polysyllabic words keep their stress, which is
 * where the mark actually disambiguates. This declutters the phrase prosody.
 */
function naturalRhythm(words: TranscribedWord[]): void {
  for (const word of words) {
    const p = word.phones;
    let nuclei = 0;
    for (const ph of p) if (ph !== '' && isNucleus(ph)) nuclei++;
    if (nuclei > 1) continue;
    for (let i = 0; i < p.length; i++) if (isStress(p[i])) p[i] = '';
  }
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
  if (flags.syllabicConsonants) syllabicConsonants(words);
  if (flags.lateralColoring) lateralColoring(words);
  if (flags.rhoticReduction) rhoticReduction(words);
  if (flags.linking) linking(words);
  if (flags.naturalRhythm) naturalRhythm(words);
}
