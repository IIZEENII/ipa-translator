/**
 * types.ts — shared types for the transcription engine.
 */

/** Toggleable connected-speech rules. */
export interface RuleFlags {
  /** Reduce unstressed function words (to → tə, and → ən, of → əv …). */
  weakForms: boolean;
  /** /t,d/ → [ɾ] between vowels (water → wɔɾɝ, get up → ɡɛɾ ʌp). */
  flapping: boolean;
  /** /t,d,s,z/ + /j/ → /tʃ,dʒ,ʃ,ʒ/ (did you → dɪdʒu, miss you → mɪʃu). */
  yodCoalescence: boolean;
  /** Place assimilation of /n,t,d,s,z/ (ten boys → tɛm, good girl → ɡʊɡ). */
  assimilation: boolean;
  /** Drop /t,d/ in a consonant cluster before another consonant (last night → lɑs naɪt). */
  elision: boolean;
  /** Collapse identical consonants across a boundary (big game → bɪɡeɪm). */
  degemination: boolean;
  /** Word-final /t/ → [ʔ] before a consonant or pause (that one → ðæʔ wʌn). */
  glottalization: boolean;
  /** Drop /h/ in unstressed pronouns/auxiliaries (tell him → tɛl ɪm). */
  hDropping: boolean;
  /** Insert linking /j/ or /w/ between vowels (I am → aɪ jæm, go on → ɡoʊ wɑn). */
  linking: boolean;
}

export const DEFAULT_FLAGS: RuleFlags = {
  weakForms: true,
  flapping: true,
  yodCoalescence: true,
  assimilation: true,
  elision: true,
  degemination: true,
  glottalization: true,
  hDropping: true,
  linking: true,
};

/** A single transcribed word in the utterance. */
export interface TranscribedWord {
  /** Original surface form as typed. */
  surface: string;
  /** Normalised lookup key. */
  lookup: string;
  /** Found in the dictionary? */
  found: boolean;
  /** Is this a function word (weak-form candidate)? */
  isFunction: boolean;
  /** Citation phones (slow, word-by-word) — never mutated by the rules. */
  citation: string[];
  /** Working phones — connected-speech rules mutate these in place. */
  phones: string[];
  /** Set when followed by clause/sentence punctuation (blocks cross-word rules). */
  breakAfter: boolean;
  /** Set for the first word of a sentence (after . ? ! or at the very start). */
  breakBefore: boolean;
  /** Whether a weak form was actually applied. */
  reduced: boolean;
  /** Alternative raw pronunciations from the dictionary (for the UI). */
  altRaw: string[];
}

export interface TranscriptionResult {
  /** Slow, citation-form transcription: `/ … /`. */
  citation: string;
  /** Connected-speech transcription: `[ … ]`. */
  connected: string;
  /** Per-word breakdown. */
  words: TranscribedWord[];
  /** Distinct words not found in the dictionary. */
  unknown: string[];
}
