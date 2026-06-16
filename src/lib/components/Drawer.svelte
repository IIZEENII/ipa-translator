<script lang="ts">
  /**
   * Drawer.svelte — a lightweight, accessible slide-in panel.
   *
   * Features: backdrop with blur, click-outside + Escape to close, body
   * scroll-lock while open, smooth fly/fade transitions, and an optional
   * sticky footer. No external dependencies.
   */
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title?: string;
    subtitle?: string;
    side?: 'left' | 'right';
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    open = $bindable(false),
    title = '',
    subtitle = '',
    side = 'right',
    children,
    footer,
  }: Props = $props();

  let panel = $state<HTMLElement | null>(null);

  function close() {
    open = false;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
    }
  }

  // Lock background scroll and move focus into the panel while open.
  $effect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      queueMicrotask(() => panel?.focus());
      return () => {
        document.body.style.overflow = previous;
      };
    }
  });

  const flyX = $derived(side === 'right' ? 420 : -420);
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <!-- Backdrop (button => keyboard-dismissable, no a11y warnings) -->
  <button
    type="button"
    aria-label="Close panel"
    onclick={close}
    transition:fade={{ duration: 180 }}
    class="fixed inset-0 z-40 cursor-default bg-slate-950/40"
  ></button>

  <div
    bind:this={panel}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label={title || 'Panel'}
    transition:fly={{ x: flyX, duration: 260, easing: cubicOut }}
    class="fixed inset-y-0 z-50 flex w-[min(380px,90vw)] flex-col bg-white shadow-2xl
           outline-none ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
    class:right-0={side === 'right'}
    class:left-0={side === 'left'}
  >
    <!-- Header -->
    <div
      class="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4
             dark:border-slate-800"
    >
      <div class="min-w-0">
        {#if title}
          <h2 class="truncate text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
        {/if}
        {#if subtitle}
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        {/if}
      </div>
      <button
        type="button"
        onclick={close}
        aria-label="Close"
        class="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
               text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600
               dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Scrollable content -->
    <div class="scroll-thin flex-1 overflow-y-auto px-3 py-3">
      {#if children} {@render children()}{/if}
    </div>

    {#if footer}
      <div class="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        {@render footer()}
      </div>
    {/if}
  </div>
{/if}
