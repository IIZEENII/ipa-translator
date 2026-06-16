import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// Normalise a base path so it always starts and ends with a single slash
// (Vite requires this). Empty / "/" both collapse to "/".
function normalizeBase(value: string | undefined, fallback: string): string {
  if (value == null) return fallback
  const trimmed = value.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Project GitHub Pages serve the site from /<repo>/. The deploy workflow
  // injects BASE_PATH (from actions/configure-pages) so built asset URLs and
  // the dictionary fetch (import.meta.env.BASE_URL) resolve correctly.
  // Local dev stays at "/".
  base: normalizeBase(
    process.env.BASE_PATH,
    command === 'build' ? '/ipa-translator/' : '/',
  ),
  server: {
    host: true,
    watch: {
      usePolling: true,
    },
  },
  plugins: [tailwindcss(), svelte()],
}))
