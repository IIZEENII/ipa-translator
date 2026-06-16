# IPA Translator

**American English → IPA transcription** with connected-speech rules (weak forms, flapping, assimilation, elision, linking, etc.).

## Features

- **125,000+ word dictionary** (General American IPA from [open-dict-data](https://github.com/open-dict-data/ipa-dict))
- **9 connected-speech rules** (individually toggleable)
- **Citation vs. natural speech** side-by-side
- **Word-by-word breakdown** showing transformations
- **Lightweight TSV format** (3.1 MB, faster than JSON)

## Tech Stack

- **Svelte 5** (runes, snippets)
- **Vite** + **TypeScript**
- **Tailwind CSS v4**
- **Bun** runtime

## Local Development

```bash
# Install dependencies
bun install

# Start dev server (http://localhost:5173)
bun run dev

# Type-check
bun run check

# Production build
bun run build
```

## Deployment (GitHub Pages)

This repo is configured to deploy automatically to GitHub Pages on every push to `main`.

### Setup (one-time)

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under **Build and deployment**, set:
   - **Source**: GitHub Actions

### How it works

- The workflow (`.github/workflows/deploy.yml`) runs on push to `main`
- `actions/configure-pages` detects your repo name and injects `BASE_PATH`
- Vite builds with the correct base path (e.g., `/my-repo/`)
- The app deploys to `https://<user>.github.io/<repo>/`

### Local testing with a subpath

To test the build with a base path locally:

```bash
BASE_PATH=/my-repo/ bun run build
bun run preview
```

Then open `http://localhost:4173/my-repo/`.

## Dictionary Format

The app auto-detects two formats:

### 1. TSV (recommended, lighter)
`public/dictionary.txt`:
```
get	/ˈɡɛt/, /ˈɡɪt/
water	/ˈwɔtɚ/, /ˈwɑtɚ/
```

### 2. JSON (fallback)
`public/dictionary.json`:
```json
{
  "get": "/ˈɡɛt/, /ˈɡɪt/",
  "water": "/ˈwɔtɚ/, /ˈwɑtɚ/"
}
```

Replace `public/dictionary.txt` with your full dataset (the sample has 10 entries for demo purposes).

## Connected-Speech Rules

| Rule | Example |
|------|---------|
| Weak forms | *to* → /tə/ · *and* → /ən/ |
| T/D flapping | *water* → /ˈwɔɾɚ/ |
| Yod coalescence | *did you* → /dɪdʒu/ |
| Place assimilation | *ten boys* → /tɛm bɔɪz/ |
| Elision | *last night* → /læs naɪt/ |
| Degemination | *big game* → /bɪɡeɪm/ |
| Glottal /t/ | *that one* → /ðæʔ wʌn/ |
| H-dropping | *tell him* → /tɛl ɪm/ |
| Linking /j/ /w/ | *go on* → /ɡoʊ wɑn/ |

## License

MIT