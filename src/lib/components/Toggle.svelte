<script lang="ts">
  /**
   * Toggle.svelte — an accessible, animated on/off switch.
   * Drives its visual state purely with Tailwind's `peer-checked` so the real
   * checkbox stays the source of truth (keyboard + screen-reader friendly).
   */
  interface Props {
    checked: boolean;
    label?: string;
    description?: string;
    id?: string;
  }

  let {
    checked = $bindable(false),
    label = '',
    description = '',
    id,
  }: Props = $props();
</script>

<label
  class="group flex cursor-pointer select-none items-start gap-3 rounded-xl p-2.5
         transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
>
  <input type="checkbox" {id} class="peer sr-only" bind:checked />
  <span
    class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-slate-300 shadow-inner
           transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5
           after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow
           after:transition-transform after:duration-200 peer-checked:bg-brand-500
           peer-checked:after:translate-x-4 peer-focus-visible:ring-2
           peer-focus-visible:ring-brand-400/60 peer-focus-visible:ring-offset-2
           peer-focus-visible:ring-offset-white dark:bg-slate-600
           dark:peer-focus-visible:ring-offset-slate-900"
  ></span>
  {#if label || description}
    <span class="min-w-0">
      {#if label}
        <span class="block text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </span>
      {/if}
      {#if description}
        <span class="font-ipa block truncate text-xs text-slate-400">{description}</span>
      {/if}
    </span>
  {/if}
</label>
