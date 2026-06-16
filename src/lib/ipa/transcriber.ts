/**
 * transcriber.ts
 * ---------------------------------------------------------------------------
 * Orchestrates the full pipeline:
 *   1. tokenize the input text into words + punctuation,
 *   2. look each word up and pick a citation form,
 *   3. choose weak/strong forms for function words (context sensitive),
 *   4. apply the connected-speech rules,
 *   5. render the citation (`/ … /`) and connected (`[ … ]`) transcriptions.
 */

import { base, isStress, isVowel, renderPhones, segment } from './phonemes';
import { lookup, type Dictionary } from './dictionary';
import { applyConnectedSpeech } from './rules';
import { getWeakForm, isFunctionWord } from './weakForms';
import type { RuleFlags, TranscribedWord, TranscriptionResult } from './types';

/** Words (incl. hyphenated + apostrophes) or runs of clause punctuation. */
const TOKEN_RE = /[A-Za-z\u2019']+(?:-[A-Za-z\u2019']+)*|[.,!?;:]+/g;

/** True if the first non-stress phone of a citation is a vowel. */
function startsWithVowel(citation: string[]): boolean {
  for (const p of citation) {
    if (p !== '' && !isStress(p)) return isVowel(base(p));
  }
  return false;
}

/** Tokenize text into ordered word records, tagging sentence/clause breaks. */
function tokenize(text: string, dict: Dictionary): TranscribedWord[] {
  const words: TranscribedWord[] = [];
  let sentenceStart = true;
  let prev: TranscribedWord | null = null;

  for (const match of text.matchAll(TOKEN_RE)) {
    const tok = match[0];
    const isPunct = /^[.,!?;:]+$/.test(tok);

    if (isPunct) {
      if (prev) prev.breakAfter = true; // any punctuation blocks liaison
      if (/[.!?]/.test(tok)) sentenceStart = true; // major break → new sentence
      continue;
    }

    const surface = tok;
    const key = surface.toLowerCase();
    const entry = lookup(dict, surface);
    const word: TranscribedWord = {
      surface,
      lookup: key,
      found: !!entry,
      isFunction: isFunctionWord(key),
      citation: entry ? entry.variants[0].slice() : [],
      phones: [],
      breakAfter: false,
      breakBefore: sentenceStart,
      reduced: false,
      altRaw: entry ? entry.raw.slice(1) : [],
    };
    words.push(word);
    prev = word;
    sentenceStart = false;
  }

  return words;
}

/** Pick weak/strong forms and seed each word's working `phones`. */
function applyWeakForms(words: TranscribedWord[], flags: RuleFlags): void {
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word.found) {
      word.phones = [];
      continue;
    }

    const stranded = word.breakAfter; // emphasised / clause-final → strong
    const useWeak = flags.weakForms && word.isFunction && !stranded;

    if (!useWeak) {
      word.phones = word.citation.slice();
      word.reduced = false;
      continue;
    }

    const wf = getWeakForm(word.lookup)!;
    let form: string;
    if (wf.hWord) {
      // H is kept utterance-initially or when H-dropping is disabled.
      const dropH = flags.hDropping && !word.breakBefore;
      form = dropH ? wf.weak : wf.withH ?? wf.weak;
    } else {
      const next = words[i + 1];
      const beforeVowel = !!next && next.found && startsWithVowel(next.citation);
      form = wf.beforeVowel && beforeVowel ? wf.beforeVowel : wf.weak;
    }

    word.phones = segment(form);
    word.reduced = renderPhones(word.phones, false) !== renderPhones(word.citation, false);
  }
}

function renderLine(
  words: TranscribedWord[],
  pick: (w: TranscribedWord) => string[],
  showStress: boolean,
): string {
  return words
    .map((w) => (w.found ? renderPhones(pick(w), showStress) : `\u27e8${w.surface}\u27e9`))
    .join(' ');
}

export interface TranscribeOptions {
  showStress?: boolean;
}

/** Transcribe `text` into citation and connected-speech IPA. */
export function transcribe(
  text: string,
  dict: Dictionary,
  flags: RuleFlags,
  options: TranscribeOptions = {},
): TranscriptionResult {
  const showStress = options.showStress ?? true;
  const words = tokenize(text, dict);

  applyWeakForms(words, flags);
  applyConnectedSpeech(words, flags);

  const unknownSet = new Set<string>();
  for (const w of words) if (!w.found) unknownSet.add(w.surface);

  return {
    citation: `/${renderLine(words, (w) => w.citation, showStress)}/`,
    connected: `[${renderLine(words, (w) => w.phones, showStress)}]`,
    words,
    unknown: [...unknownSet],
  };
}
