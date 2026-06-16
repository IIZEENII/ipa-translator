/**
 * phonemes.ts
 * ---------------------------------------------------------------------------
 * Phoneme inventory, IPA segmentation and classification helpers for the
 * General American transcription engine.
 *
 * The dictionary values look like `/ˈwɔtɝ/` (open-dict "en_US" style). We strip
 * the slashes and split the string into an array of "phones" where multi-glyph
 * units (affricates `tʃ dʒ` and diphthongs `eɪ oʊ aɪ aʊ ɔɪ`) are kept as one
 * element, stress marks (`ˈ ˌ`) are kept as their own elements, and a length
 * mark (`ː`) is attached to the preceding phone.
 */

/** Primary/secondary stress marks. */
export const STRESS_MARKS = new Set(['ˈ', 'ˌ']);

/** Multi-character phonemes that must not be split apart. */
export const MULTI_CHAR = ['tʃ', 'dʒ', 'eɪ', 'oʊ', 'aɪ', 'aʊ', 'ɔɪ'];

/** Monophthongs + diphthongs found in General American transcriptions. */
export const VOWELS = new Set([
  'i', 'ɪ', 'e', 'ɛ', 'æ', 'ə', 'ʌ', 'ɝ', 'ɚ', 'u', 'ʊ', 'o', 'ɔ', 'ɑ', 'ɒ',
  'a', 'ɜ', 'ɐ',
  'eɪ', 'oʊ', 'aɪ', 'aʊ', 'ɔɪ',
]);

/** Consonants (both `ɡ`/`g` and `ɹ`/`r`, `l`/`ɫ` accepted as equivalents). */
export const CONSONANTS = new Set([
  'p', 'b', 't', 'd', 'k', 'ɡ', 'g',
  'tʃ', 'dʒ', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h',
  'm', 'n', 'ŋ', 'l', 'ɫ', 'ɹ', 'r', 'j', 'w',
  'ʔ', 'ɾ', 'ɲ', 'x',
]);

/** Places of articulation used by the assimilation rules. */
export const BILABIAL = new Set(['p', 'b', 'm']);
export const VELAR = new Set(['k', 'ɡ', 'g', 'ŋ']);
export const POSTALVEOLAR = new Set(['ʃ', 'ʒ', 'tʃ', 'dʒ']);

/** Lateral approximants (light /l/ and dark /ɫ/ are allophones of one phoneme). */
export const LATERAL = new Set(['l', 'ɫ']);

/**
 * Coronal consonants after which an unstressed /ə/ + /n/ readily becomes a
 * syllabic [n̩] (button, garden, listen, reason, kitten→kɪɾn̩). The alveolar
 * flap [ɾ] is included so flapped words still syllabify.
 */
export const SYLLABIC_N_LEFT = new Set([
  't', 'd', 'ɾ', 's', 'z', 'θ', 'ð', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'n',
]);

/** Combining mark (U+0329) that turns a sonorant into a syllabic consonant. */
export const SYLLABIC_MARK = '\u0329';

/** Combining diacritics that are stripped to recover a phone's base symbol. */
const DIACRITICS = /[ːˑ\u0329\u032F\u0325\u030A\u02B0\u0303\u031A]/g;

/** High front nuclei that trigger a linking /j/, and rounded ones a linking /w/. */
export const FRONT_GLIDE_VOWELS = new Set(['i', 'ɪ', 'eɪ', 'aɪ', 'ɔɪ']);
export const BACK_GLIDE_VOWELS = new Set(['u', 'ʊ', 'oʊ', 'aʊ']);

/** Vowels plus rhotic/approximant nuclei that license T/D-flapping on the left. */
export const FLAP_LEFT_CONTEXT = new Set([...VOWELS, 'r', 'ɹ', 'ɝ', 'ɚ']);

/** Strip length/syllabic/other combining marks so classification works on the base symbol. */
export function base(sym: string): string {
  return sym.replace(DIACRITICS, '');
}

export function isStress(sym: string): boolean {
  return STRESS_MARKS.has(sym);
}

export function isVowel(sym: string | null | undefined): boolean {
  return !!sym && VOWELS.has(base(sym));
}

export function isConsonant(sym: string | null | undefined): boolean {
  return !!sym && CONSONANTS.has(base(sym));
}

/** True if this phone carries the syllabic mark (e.g. l̩, n̩, m̩). */
export function isSyllabic(sym: string): boolean {
  return sym.includes(SYLLABIC_MARK);
}

/** True if this phone is a syllable nucleus: a vowel or a syllabic consonant. */
export function isNucleus(sym: string): boolean {
  return isVowel(sym) || isSyllabic(sym);
}

/** Remove the surrounding `/.../` (or `[...]`) delimiters and trim whitespace. */
export function deslash(ipa: string): string {
  return ipa.replace(/^[/[]+/, '').replace(/[/\]]+$/, '').trim();
}

/**
 * Normalise raw dictionary glyphs to the canonical set the engine reasons about
 * (ASCII `g` → script `ɡ`). Other equivalences (`ɹ`/`r`, `l`/`ɫ`) are handled at
 * comparison time via the sets above, so they are intentionally left intact.
 */
export function normalizeGlyphs(ipa: string): string {
  return ipa.replace(/g/g, 'ɡ');
}

/**
 * Split an IPA string into an array of phones. Stress marks are standalone
 * elements; length marks attach to the previous phone; syllable dots dropped.
 */
export function segment(ipa: string): string[] {
  const s = normalizeGlyphs(deslash(ipa));
  const out: string[] = [];
  for (let i = 0; i < s.length; ) {
    const two = s.slice(i, i + 2);
    if (MULTI_CHAR.includes(two)) {
      out.push(two);
      i += 2;
      continue;
    }
    const ch = s[i];
    i += 1;
    if (ch === '.' || ch === ' ') continue; // drop syllable separators / spaces
    if (ch === 'ː' && out.length) {
      out[out.length - 1] += 'ː';
      continue;
    }
    out.push(ch);
  }
  return out;
}

/** Render a phone array back to a string, optionally dropping stress marks. */
export function renderPhones(phones: string[], showStress = true): string {
  return phones
    .filter((p) => p !== '' && (showStress || !isStress(p)))
    .join('');
}
