# IPA Translator — American English → IPA# Svelte + TS + Vite



A friendly web app that transcribes American English sentences into theThis template should help get you started developing with Svelte and TypeScript in Vite.

International Phonetic Alphabet, applying the **connected-speech** processes of

natural, casual pronunciation: weak forms, T/D-flapping, yod-coalescence, place## Recommended IDE Setup

assimilation, elision, degemination, glottalization, H-dropping and linking

glides.[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).



Built with **Svelte 5 + TypeScript + Vite + Tailwind CSS v4**.## Need an official Svelte framework?



## How it worksCheck out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.



1. **Dictionary** — pronunciations come from a local dataset in## Technical considerations

   `public/dictionary.txt` using the lightweight `ipa-dict` "en_US" format:

**Why use this over SvelteKit?**

   ```

   get	/ˈɡɛt/, /ˈɡɪt/- It brings its own routing solution which might not be preferable for some users.

   water	/ˈwɔtɝ/- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

   ```

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

   One entry per line: `word<TAB>/ipa/, /ipa/`. The first variant is the primary

   pronunciation. A JSON object (`{ "word": "/ipa/" }`) is also auto-detected, soShould you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

   you can drop in `public/dictionary.json` instead — but the TSV is ~25% smaller

   and parses faster, so it is preferred.**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**



2. **Engine** (`src/lib/ipa/`)Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

   - `phonemes.ts` — phoneme inventory, IPA segmenter, vowel/consonant helpers.

   - `dictionary.ts` — loads/parses the dataset and looks words up.**Why include `.vscode/extensions.json`?**

   - `weakForms.ts` — reduced forms for function words (`to → tə`, `and → ən`…).

   - `rules.ts` — the connected-speech rules, applied in feeding order.Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

   - `transcriber.ts` — tokenizes input and produces two transcriptions:

     - **Citation form** `/ … /` — slow, word-by-word.**Why enable `allowJs` in the TS template?**

     - **Connected speech** `[ … ]` — natural, with the rules applied.

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

3. **UI** (`src/App.svelte`) — a textarea with the outputs stacked below it, a

   per-word breakdown, unknown-word reporting, and a slide-in **Rules drawer****Why is HMR not preserving my local component state?**

   (`src/lib/components/Drawer.svelte`) to toggle each process on/off.

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

## Develop

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```bash

bun install```ts

bun run dev      # http://localhost:5173// store.ts

bun run check    # svelte-check + tsc// An extremely simple external store

bun run build    # production build → dist/import { writable } from 'svelte/store'

```export default writable(0)

```

> Uses [Bun](https://bun.sh). `npm`/`pnpm` work too — swap the commands.

## Replacing the dictionary

Drop your full dataset in as `public/dictionary.txt` (TSV) or
`public/dictionary.json`. No code changes needed — the loader auto-detects the
format and the app reports how many entries were loaded in the footer.

## Deploy to GitHub Pages

This repo ships a ready-to-use workflow at `.github/workflows/deploy.yml`
(repository root). It builds the app from this `ipa-translator/` subfolder with
Bun and publishes it via GitHub Pages.

**One-time setup**

1. Push the project to GitHub on the **`main`** branch.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.

That's it. Every push to `main` (or a manual run from the **Actions** tab) builds
and deploys the site to:

```
https://<your-username>.github.io/<your-repo>/
```

**How the base path is handled** — GitHub Pages serves a project site from
`/<repo>/`, so asset URLs must be prefixed. The workflow reads the repo name via
`actions/configure-pages` and passes it to the build as `BASE_PATH`;
`vite.config.ts` normalizes it and sets Vite's `base`. The dictionary fetch uses
`import.meta.env.BASE_URL`, so it resolves correctly under the subpath too.
Nothing is hard-coded — it adapts to whatever your repository is named.

> If your default branch is `master`, change `branches: [main]` in the workflow,
> or just trigger it manually from the Actions tab.
