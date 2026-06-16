/**
 * weakForms.ts
 * ---------------------------------------------------------------------------
 * Weak (reduced) forms for English function words. In connected speech these
 * words are normally unstressed and reduce to a schwa-based pronunciation, e.g.
 * `to` /tu/ → /tə/, `and` /ænd/ → /ən/, `of` /ʌv/ → /əv/.
 *
 * Notes on the fields:
 *  - `weak`        : default reduced form.
 *  - `beforeVowel` : variant used when the next word starts with a vowel
 *                    (e.g. `the` → /ði/, `to` → /tu/, `do`/`you` keep the glide
 *                    so a linking /j/ can attach).
 *  - `hWord`       : pronoun/auxiliary beginning with /h/. The `weak` value is
 *                    the H-DROPPED form; `withH` keeps the /h/ (used utterance
 *                    initially or when H-dropping is disabled).
 *
 * A weak form is only applied when the word is unstressed (not stranded at a
 * clause boundary and not emphasised) and the "weak forms" rule is enabled.
 */

export interface WeakForm {
  weak: string;
  beforeVowel?: string;
  hWord?: boolean;
  withH?: string;
}

export const WEAK_FORMS: Record<string, WeakForm> = {
  // articles / determiners
  a: { weak: 'ə' },
  an: { weak: 'ən' },
  the: { weak: 'ðə', beforeVowel: 'ði' },
  some: { weak: 'səm' },

  // prepositions / conjunctions
  to: { weak: 'tə', beforeVowel: 'tu' },
  of: { weak: 'əv' },
  for: { weak: 'fɚ' },
  from: { weak: 'frəm' },
  at: { weak: 'ət' },
  as: { weak: 'əz' },
  than: { weak: 'ðən' },
  and: { weak: 'ən' },
  but: { weak: 'bət' },
  or: { weak: 'ɚ' },

  // pronouns / possessives
  
  you: { weak: 'jə', beforeVowel: 'ju' },
  your: { weak: 'jɚ' },
  us: { weak: 'əs' },
  them: { weak: 'ðəm' },
  he: { weak: 'i', hWord: true, withH: 'hi' },
  him: { weak: 'ɪm', hWord: true, withH: 'hɪm' },
  her: { weak: 'ɚ', hWord: true, withH: 'hɚ' },
  his: { weak: 'ɪz', hWord: true, withH: 'hɪz' },

  // auxiliaries / modals
  have: { weak: 'əv', hWord: true, withH: 'həv' },
  has: { weak: 'əz', hWord: true, withH: 'həz' },
  had: { weak: 'əd', hWord: true, withH: 'həd' },
  do: { weak: 'də', beforeVowel: 'du' },
  does: { weak: 'dəz' },
  was: { weak: 'wəz' },
  were: { weak: 'wɚ' },
  are: { weak: 'ɚ' },
  am: { weak: 'əm' },
  can: { weak: 'kən' },
  could: { weak: 'kəd' },
  would: { weak: 'wəd' },
  should: { weak: 'ʃəd' },
  shall: { weak: 'ʃəl' },
  will: { weak: 'wəl' },
  must: { weak: 'məst' },
};

export function isFunctionWord(word: string): boolean {
  return Object.prototype.hasOwnProperty.call(WEAK_FORMS, word.toLowerCase());
}

export function getWeakForm(word: string): WeakForm | undefined {
  return WEAK_FORMS[word.toLowerCase()];
}
