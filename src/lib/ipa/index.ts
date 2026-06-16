/**
 * Public API for the IPA transcription engine.
 */
export { loadDictionary, parseDictionary, lookup } from './dictionary';
export type { Dictionary, DictEntry } from './dictionary';
export { transcribe } from './transcriber';
export type { TranscribeOptions } from './transcriber';
export { applyConnectedSpeech } from './rules';
export { WEAK_FORMS, isFunctionWord, getWeakForm } from './weakForms';
export { renderPhones, segment } from './phonemes';
export { DEFAULT_FLAGS } from './types';
export type { RuleFlags, TranscribedWord, TranscriptionResult } from './types';
