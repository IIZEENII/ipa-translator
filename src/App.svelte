<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Drawer from './lib/components/Drawer.svelte';
  import Toggle from './lib/components/Toggle.svelte';
  import {
    loadDictionary,
    transcribe,
    renderPhones,
    DEFAULT_FLAGS,
    type Dictionary,
    type RuleFlags,
    type TranscriptionResult,
  } from './lib/ipa';

  const SAMPLE = 'How\u2019s it going?';

  let text = $state(SAMPLE);
  let flags = $state<RuleFlags>({ ...DEFAULT_FLAGS });
  let showStress = $state(true);
  let rulesOpen = $state(false);

  let dict = $state<Dictionary | null>(null);
  let loading = $state(true);
  let loadError = $state('');
  let copied = $state<string | null>(null);

  const RULES: { key: keyof RuleFlags; label: string; ex: string }[] = [
    { key: 'weakForms', label: 'Weak forms', ex: 'to \u2192 t\u0259 \u00b7 and \u2192 \u0259n' },
    { key: 'flapping', label: 'T / D flapping', ex: 'water \u2192 \u02c8w\u0254\u027e\u025d' },
    { key: 'yodCoalescence', label: 'Yod coalescence', ex: 'did you \u2192 d\u026ad\u0292u' },
    { key: 'assimilation', label: 'Place assimilation', ex: 'ten boys \u2192 t\u025bm b\u0254\u026az' },
    { key: 'elision', label: 'Elision (drop t / d)', ex: 'last night \u2192 l\u00e6s na\u026at' },
    { key: 'degemination', label: 'Degemination', ex: 'big game \u2192 b\u026a\u0261e\u026am' },
    { key: 'glottalization', label: 'Glottal /t/', ex: 'that one \u2192 \u00f0\u00e6\u0294 w\u028cn' },
    { key: 'hDropping', label: 'H-dropping', ex: 'tell him \u2192 t\u025bl \u026am' },
    { key: 'linking', label: 'Linking /j/ /w/', ex: 'go on \u2192 \u0261o\u028a w\u0251n' },
  ];

  const result = $derived.by<TranscriptionResult | null>(() =>
    dict ? transcribe(text, dict, flags, { showStress }) : null,
  );
  const hasText = $derived(text.trim().length > 0);
  const wordCount = $derived(text.trim() ? text.trim().split(/\s+/).length : 0);
  const activeCount = $derived(RULES.filter((r) => flags[r.key]).length);
  const activeLabels = $derived(RULES.filter((r) => flags[r.key]).map((r) => r.label));

  onMount(async () => {
    try {
      dict = await loadDictionary();
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  });

  async function copy(kind: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      copied = kind;
      setTimeout(() => (copied = copied === kind ? null : copied), 1300);
    } catch {
      /* clipboard unavailable */
    }
  }

  function setAll(value: boolean) {
    flags = {
      weakForms: value,
      flapping: value,
      yodCoalescence: value,
      assimilation: value,
      elision: value,
      degemination: value,
      glottalization: value,
      hDropping: value,
      linking: value,
    };
  }
</script>

<!-- Reusable copy button -->
{#snippet copyButton(kind: string, value: string, primary: boolean)}
  <button
    type="button"
    onclick={() => copy(kind, value)}
    disabled={!hasText}
    class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
           transition disabled:cursor-not-allowed disabled:opacity-40
           {primary
      ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700'
      : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'}"
  >
    {#if copied === kind}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Copied
    {:else}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      Copy
    {/if}
  </button>
{/snippet}

<div class="relative min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
  <!-- Decorative aurora -->
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-600/20"></div>
    <div class="absolute -right-32 top-24 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-700/10"></div>
  </div>

  <!-- Sticky header -->
  <header
    class="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-lg
           dark:border-slate-800/70 dark:bg-slate-950/70"
  >
    <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500
                 text-white shadow-lg shadow-brand-500/30"
        >
          <span class="font-ipa text-xl leading-none">ə</span>
        </div>
        <div class="leading-tight">
          <h1 class="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
            IPA Translator
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            American English &rarr; IPA
          </p>
        </div>
      </div>

      <button
        type="button"
        onclick={() => (rulesOpen = true)}
        class="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white
               px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition
               hover:border-brand-300 hover:text-brand-600 dark:border-slate-700
               dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500/50"
      >
        <svg class="transition-transform group-hover:rotate-45" width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span class="hidden sm:inline">Rules</span>
        <span
          class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500/15
                 px-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300"
        >
          {activeCount}
        </span>
      </button>
    </div>
  </header>

  <main class="relative z-10 mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
    {#if loading}
      <div class="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm
                  dark:border-slate-800 dark:bg-slate-900">
        <div class="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-brand-500
                    border-t-transparent"></div>
        <p class="text-sm text-slate-500">Loading dictionary&hellip;</p>
      </div>
    {:else if loadError}
      <div class="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-800
                  dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
        <p class="font-semibold">Could not load the dictionary.</p>
        <p class="mt-1 text-sm opacity-80">{loadError}</p>
        <p class="mt-3 text-sm">
          Add your dataset as
          <code class="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">public/dictionary.txt</code>
          (<code class="font-mono">word&lt;TAB&gt;/ipa/</code> per line) or
          <code class="font-mono">public/dictionary.json</code>.
        </p>
      </div>
    {:else}
      <!-- Input -->
      <section
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5
               dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="mb-3 flex items-center justify-between">
          <label for="text" class="text-sm font-semibold text-slate-900 dark:text-white">
            English sentence
          </label>
          <div class="flex gap-1 text-sm">
            <button
              type="button"
              onclick={() => (text = SAMPLE)}
              class="rounded-lg px-2.5 py-1 text-brand-600 transition hover:bg-brand-50
                     dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              Example
            </button>
            <button
              type="button"
              onclick={() => (text = '')}
              disabled={!hasText}
              class="rounded-lg px-2.5 py-1 text-slate-500 transition hover:bg-slate-100
                     disabled:opacity-40 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          id="text"
          bind:value={text}
          rows="4"
          placeholder="Type or paste an English sentence&hellip;"
          class="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-lg
                 leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400
                 focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20 dark:border-slate-700
                 dark:bg-slate-950 dark:text-white"
        ></textarea>

        <div class="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            {#if activeCount === RULES.length}
              All connected-speech rules on
            {:else if activeCount === 0}
              Citation only &middot; no rules
            {:else}
              {activeCount} of {RULES.length} rules on
            {/if}
          </span>
          <span>{wordCount} word{wordCount === 1 ? '' : 's'}</span>
        </div>
      </section>

      <!-- Outputs (below the textarea) -->
      <div class="mt-5 space-y-4">
        {#if !hasText}
          <div
            class="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center
                   dark:border-slate-700 dark:bg-slate-900/40"
            in:fade={{ duration: 150 }}
          >
            <p class="font-ipa text-2xl text-slate-300 dark:text-slate-600">[ … ]</p>
            <p class="mt-2 text-sm text-slate-400">Your transcription will appear here.</p>
          </div>
        {:else if result}
          <!-- Connected speech (hero) -->
          <section
            class="relative overflow-hidden rounded-2xl border border-brand-200 bg-linear-to-br
                   from-brand-50 to-white p-5 shadow-sm dark:border-brand-500/30
                   dark:from-brand-500/10 dark:to-slate-900"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <h2 class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span class="truncate">Connected speech</span>
                <span class="shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium
                             text-brand-700 dark:text-brand-300">natural</span>
              </h2>
              <div class="shrink-0">
                {@render copyButton('connected', result.connected, true)}
              </div>
            </div>

            <div
              class="scroll-thin max-h-[40vh] overflow-y-auto bg-white/60 p-4
                     ring-1 ring-inset ring-brand-200/60 dark:bg-slate-950/40 dark:ring-white/10"
            >
              <p
                class="font-ipa wrap-anywhere text-xl leading-relaxed text-brand-700
                       selection:bg-brand-200 dark:text-brand-200"
              >
                {result.connected}
              </p>
            </div>

            {#if activeLabels.length}
              <div class="mt-4 flex flex-wrap gap-1.5">
                {#each activeLabels as label (label)}
                  <span class="rounded-md bg-white/70 px-2 py-0.5 text-xs text-slate-500
                               ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-400
                               dark:ring-white/10">{label}</span>
                {/each}
              </div>
            {/if}
          </section>

          <!-- Citation -->
          <section
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
                   dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <h2 class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span class="truncate">Citation form</span>
                <span class="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium
                             text-slate-600 dark:bg-slate-700 dark:text-slate-300">slow</span>
              </h2>
              <div class="shrink-0">
                {@render copyButton('citation', result.citation, false)}
              </div>
            </div>
            <div
              class="scroll-thin max-h-[40vh] overflow-y-auto rounded-xl bg-slate-50 p-4
                     ring-1 ring-inset ring-slate-200/70 dark:bg-slate-950/50 dark:ring-white/5"
            >
              <p class="font-ipa wrap-anywhere text-xl leading-relaxed text-slate-700 dark:text-slate-200">
                {result.citation}
              </p>
            </div>
          </section>

          <!-- Unknown words -->
          {#if result.unknown.length}
            <div
              class="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900
                     dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
              in:fade={{ duration: 150 }}
            >
              <p class="text-sm font-semibold">
                {result.unknown.length} word{result.unknown.length === 1 ? '' : 's'} not in the dictionary
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                {#each result.unknown as w (w)}
                  <span class="rounded-md bg-amber-200/60 px-2 py-0.5 font-mono text-sm
                               dark:bg-amber-500/20">{w}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Word-by-word breakdown -->
          {#if result.words.length}
            <details
              class="group rounded-2xl border border-slate-200 bg-white shadow-sm
                     dark:border-slate-800 dark:bg-slate-900"
              open
            >
              <summary
                class="flex cursor-pointer list-none items-center justify-between p-5
                       text-sm font-semibold text-slate-900 dark:text-white"
              >
                Word by word
                <svg class="text-slate-400 transition-transform group-open:rotate-180"
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div class="overflow-x-auto px-5 pb-5">
                <table class="w-full text-left text-sm">
                  <thead class="text-xs uppercase tracking-wide text-slate-400">
                    <tr class="border-b border-slate-100 dark:border-slate-800">
                      <th class="py-2 pr-4 font-medium">Word</th>
                      <th class="py-2 pr-4 font-medium">Citation</th>
                      <th class="py-2 pr-4 font-medium">Connected</th>
                      <th class="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each result.words as w, i (i)}
                      <tr class="border-b border-slate-50 last:border-0 dark:border-slate-800/50">
                        <td class="py-2 pr-4 text-slate-700 dark:text-slate-200">{w.surface}</td>
                        <td class="font-ipa py-2 pr-4 text-slate-500 dark:text-slate-400">
                          {w.found ? renderPhones(w.citation, showStress) : '\u2014'}
                        </td>
                        <td class="font-ipa py-2 pr-4 text-brand-600 dark:text-brand-300">
                          {w.found ? renderPhones(w.phones, showStress) : '\u2014'}
                        </td>
                        <td class="py-2">
                          {#if !w.found}
                            <span class="rounded bg-amber-200/70 px-1.5 py-0.5 text-xs text-amber-900
                                         dark:bg-amber-500/20 dark:text-amber-200">not found</span>
                          {:else if w.reduced}
                            <span class="rounded bg-brand-500/15 px-1.5 py-0.5 text-xs text-brand-700
                                         dark:text-brand-300">weak</span>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </details>
          {/if}
        {/if}
      </div>

      <footer class="mt-8 text-center text-xs text-slate-400">
        {dict?.size.toLocaleString() ?? 0} dictionary entries &middot; General American
      </footer>
    {/if}
  </main>
</div>

<!-- Rules drawer -->
<Drawer
  bind:open={rulesOpen}
  title="Connected-speech rules"
  subtitle="Toggle the phonological processes applied to the natural transcription."
>
  <div class="space-y-0.5">
    {#each RULES as rule (rule.key)}
      <Toggle bind:checked={flags[rule.key]} label={rule.label} description={rule.ex} />
    {/each}
  </div>

  <div class="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
    <Toggle bind:checked={showStress} label="Show stress marks" description="ˈ primary · ˌ secondary" />
  </div>

  {#snippet footer()}
    <div class="flex items-center justify-between">
      <span class="text-xs text-slate-400">{activeCount} of {RULES.length} active</span>
      <div class="flex gap-1">
        <button
          type="button"
          onclick={() => setAll(true)}
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 transition
                 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
        >
          Enable all
        </button>
        <button
          type="button"
          onclick={() => setAll(false)}
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition
                 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Disable all
        </button>
      </div>
    </div>
  {/snippet}
</Drawer>
