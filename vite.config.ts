import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

function normalizeBase(raw: string | undefined): string {
  if (!raw) return '/'
  const trimmed = raw.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

export default defineConfig(({ command }) => {
  // In dev, always use root; in build, use BASE_PATH from env (injected by CI)
  // or default to '/' for local builds (you can override with `BASE_PATH=/my-repo/ bun run build`)
  const base = command === 'serve' ? '/' : normalizeBase(process.env.BASE_PATH)

  return {
    server: {
      host: true,
      watch: {
        usePolling: true,
      },
    },
    plugins: [tailwindcss(), svelte()],
    base,
  }
})