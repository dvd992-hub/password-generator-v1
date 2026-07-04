# Password Generator

A secure, fully offline password generator built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step, no external runtime dependencies. Open `index.html` in any modern browser and it works.

---

## Changelog

### v2.1 — Favicon fix

**Problem:** the `.ico` file contained PNG chunks compressed at the maximum level by `cairosvg`, producing images of only 456 bytes at 16×16. Some browsers and OS icon viewers treated these as corrupt and silently discarded them, showing no favicon in the tab.

**Fix:** rebuilt the ICO from scratch using Pillow with `compress_level=0` (store mode). Each PNG chunk is now uncompressed raw pixel data, which every browser reads without issue.

| Size | Before | After |
|------|--------|-------|
| 16×16 | 456 B | 1,108 B |
| 32×32 | 840 B | 4,196 B |
| 48×48 | 1,291 B | 9,332 B |
| **Total ICO** | **2,641 B** | **14,690 B** |

A second fix addressed loading in `file://` contexts: both favicon formats are now embedded as **base64 data URIs** directly in `<head>`, so no relative path resolution is needed.

```html
<!-- SVG — scalable, preferred by modern browsers -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,..." />

<!-- ICO — 16/32/48 px fallback for older browsers and pinned tabs -->
<link rel="icon" type="image/x-icon"  href="data:image/x-icon;base64,..."
      sizes="16x16 32x32 48x48" />
```

The physical files in `assets/favicon/` are kept for server deployments where relative paths work normally.

Files changed: `index.html` (data URI links updated), `assets/favicon/favicon.ico` (rebuilt).

---

### v2.0 — Full rewrite

Complete rewrite from v1.x. Every file is now in English (identifiers, comments, strings). Summary of changes by area:

#### Project structure

```
Before (v1.x)       After (v2.0)
──────────────────  ──────────────────────────────────
index.html          index.html
style.css           css/style.css
script.js           js/script.js
                    i18n/translations.js        ← new
                    assets/favicon/favicon.svg  ← new
                    assets/favicon/favicon.ico  ← new
README.md           README.md
```

#### Language (i18n)

Added a hybrid localisation system:

1. On startup the app reads `navigator.language` (browser / OS setting) and resolves the closest supported locale (`en` or `it`).
2. If the user has previously chosen a language manually, that choice is read from `localStorage` (`pg_locale`) and takes priority.
3. A **EN | IT** pill toggle in the top-right corner lets the user switch at any time; the choice persists across sessions.

All translatable strings live in `i18n/translations.js` as a single `TRANSLATIONS` object keyed by camelCase identifier and locale. Adding a third language requires only a new key per entry and a new button in `index.html` — no other changes.

#### Icons

Removed the Tabler Icons CDN `<link>` (broken when opening `file://` without a network). All 8 icons are now inline SVG `<symbol>` elements in `index.html`, referenced with `<svg><use href="#icon-NAME"/></svg>`. The app is fully offline.

#### Favicons

Added `assets/favicon/favicon.svg` and `assets/favicon/favicon.ico` (16/32/48 px). Both declared in `<head>` — see v2.1 above for the corrected embedding strategy.

#### Code language

Every identifier, comment, string, and filename translated from Italian to English:

| Before | After |
|--------|-------|
| `script.js` | `js/script.js` |
| `style.css` | `css/style.css` |
| `modalita` | `currentMode` |
| `cronologia` | `historyEntries` |
| `mascherato` | `isMasked` |
| `passwordCorrente` | `currentPassword` |
| All Italian comments | English JSDoc annotations |

#### Minor improvements

- `currentMode` values changed from `'pass'` / `'phrase'` to `'password'` / `'passphrase'` for clarity.
- History entries carry a `mode` field instead of `type`.
- Strength label text fetched via `t()` — updates live on locale change.
- Separator `<select>` option labels translated on locale change.
- All ARIA labels translated via `applyTranslations()`.

---

### v1.2 — Inline SVG icons

**Bug fixed:** action buttons (regenerate, show/hide, copy) had no visible icons when the page was opened via `file://` or offline, because Tabler Icons was loaded from an external CDN.

**Fix:** removed the CDN `<link>`. All icons defined as `<symbol>` elements in an inline SVG sprite, referenced with `<use href="#icon-...">`.

Files changed: `index.html`, `style.css` (`.icon` sizing rule), `script.js` (`toggleMask` icon swap, history copy button markup).

---

### v1.1 — Initial release

First complete version:

- Password mode and Passphrase mode (tab switcher)
- Cryptographically secure generation via `crypto.getRandomValues()`
- 4-level strength meter based on bit entropy
- Options: length, charset, separator, capitalisation, trailing number
- Show / hide toggle (password mode only)
- Clipboard copy with confirmation toast
- Session history — last 10 entries, with per-row copy button
- Automatic dark mode via `@media (prefers-color-scheme: dark)`
- Responsive layout down to 320 px

---

## Project structure

```
password-generator/
├── index.html                    Markup, inline SVG sprite, script tags
├── css/
│   └── style.css                 All styles — variables, layout, components, dark mode
├── js/
│   └── script.js                 Generation logic, strength meter, history, i18n wiring
├── i18n/
│   └── translations.js           Translation strings and locale resolution helpers
├── assets/
│   └── favicon/
│       ├── favicon.svg           Scalable favicon (modern browsers)
│       └── favicon.ico           Multi-size raster fallback (16 / 32 / 48 px)
└── README.md
```

---

## Features

### Password mode

Generates a random string from a configurable character pool using `crypto.getRandomValues()` — the browser's CSPRNG. `Math.random()` is never used.

| Option | Default | Range |
|--------|---------|-------|
| Length | 16 | 6 – 64 |
| Uppercase (A–Z) | ✓ | — |
| Lowercase (a–z) | ✓ | — |
| Numbers (0–9) | ✓ | — |
| Symbols (`! @ # …`) | — | — |
| Exclude ambiguous (`0 O l I 1`) | — | — |

### Passphrase mode

Generates a sequence of random Italian words joined by a configurable separator. Easier to memorise than random strings while remaining strong at typical word counts.

| Option | Default |
|--------|---------|
| Word count | 4 (range 3 – 8) |
| Separator | hyphen `-` |
| Capitalize first letter | ✓ |
| Append number (10 – 99) | — |

Example: `Lupo-Cascata-Fiore-73`

### Strength meter

Entropy estimated with:

```
H = L × log₂(N)
```

`L` = password length, `N` = character pool size inferred from classes present.

| Entropy | Level | Colour |
|---------|-------|--------|
| < 40 bit | Very weak | Red |
| 40 – 59 bit | Weak | Amber |
| 60 – 79 bit | Fair | Green |
| ≥ 80 bit | Strong | Teal |

### Show / hide

Password output is masked with `•` by default. The eye button toggles visibility without regenerating. Not shown in passphrase mode (passphrases are always readable).

### Copy to clipboard

Uses `navigator.clipboard.writeText()`. A green toast confirms success for 2 seconds. Every history row also has its own copy button.

### History

Last 10 generated entries kept in RAM for the session — cleared on tab close. Each row shows the truncated text (full on hover), a type badge (`pass` / `phrase`), a timestamp (HH:MM), and a copy button.

### Language toggle (EN | IT)

Locale resolved on startup in priority order:

1. `localStorage` key `pg_locale` (previous manual choice)
2. `navigator.language` (browser / OS language)
3. English fallback

The **EN | IT** pill in the top-right corner overrides the automatic choice and saves it to `localStorage`.

---

## Running locally

No installation required. Double-click `index.html`, or serve over HTTP for full Clipboard API support:

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .
```

Then open `http://localhost:8080`.

> **Note:** `navigator.clipboard.writeText()` requires a secure context (HTTPS or `localhost`). Opening via `file://` may silently block clipboard writes in some browsers.

---

## Security

| Aspect | Detail |
|--------|--------|
| Random source | `crypto.getRandomValues()` — CSPRNG, not `Math.random()` |
| Password storage | None. History is RAM-only; cleared on tab close |
| Network | Zero outbound requests at runtime |
| Icons | Inline SVG sprite — no CDN |
| `localStorage` | Stores only the locale string (`pg_locale`), never passwords |

---

## Browser compatibility

| Browser | Minimum version |
|---------|----------------|
| Chrome / Edge | 60+ |
| Firefox | 55+ |
| Safari | 11+ |
| Opera | 50+ |

Hard requirements: `crypto.getRandomValues()`, `navigator.clipboard`, CSS custom properties.

---

## Customisation

### Add symbols to the pool

In `js/script.js`:

```js
const CHARS_SYMS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
// Append any printable character, e.g.: + '€£¥'
```

### Extend the passphrase wordlist

In `js/script.js`:

```js
const WORDLIST = [
  'corvo', 'nuvola', /* … */,
  'myword',  // ← add here
];
```

### Add a third language

1. `i18n/translations.js` — add to `SUPPORTED_LOCALES` and supply the translation for every key:

```js
const SUPPORTED_LOCALES = ['en', 'it', 'fr'];

const TRANSLATIONS = {
  pageTitle: { en: 'Password Generator', it: 'Generatore di Password', fr: 'Générateur de mot de passe' },
  // repeat for every key …
};
```

2. `index.html` — add a button to the toggle:

```html
<button class="lang-btn" data-lang="fr">FR</button>
```

### Add a custom icon

Define a `<symbol>` in the SVG sprite in `index.html`:

```html
<symbol id="icon-myicon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
  <!-- SVG path here -->
</symbol>
```

Reference it anywhere:

```html
<svg class="icon" aria-hidden="true"><use href="#icon-myicon"/></svg>
```

### Change the accent colour

In `css/style.css`, edit `:root`:

```css
:root {
  --accent:       #534AB7;  /* primary  */
  --accent-dark:  #3C3489;  /* on hover */
  --accent-light: #EEEDFE;  /* tint     */
}
```

### Raise the history limit

In `js/script.js`:

```js
const HISTORY_LIMIT = 10;  // ← change as needed
```

---

## Code architecture

```
js/script.js
├── Constants          CHARS_UPPER / LOWER / NUMS / SYMS, AMBIGUOUS_RE
├── WORDLIST           50 Italian nouns for passphrase mode
├── State              currentMode, historyEntries, isMasked, currentPassword
├── DOM refs           elPass, elLen, bars, elEyeIcon, …
│
├── estimateEntropy()  → entropy in bits (H = L × log₂N)
├── setStrengthUI()    → colour the 4 bars + update label
├── updateStrength()   → compute level and call setStrengthUI()
│
├── cryptoRandom()     → CSPRNG pick from an array
├── generatePassword() → random string from active charset pool
├── generatePassphrase()→ random word sequence from WORDLIST
├── generate()         → dispatch to the correct generator, render, log history
├── renderOutput()     → write to the output field; apply masking
│
├── copyToClipboard()  → navigator.clipboard + fade-in toast
├── addToHistory()     → prepend entry, trim to HISTORY_LIMIT
├── renderHistory()    → rebuild the history list in the DOM
│
├── toggleMask()       → swap •••↔plaintext and update eye icon href
├── activatePasswordMode()   → tab + panel switch + generate
├── activatePassphraseMode() → tab + panel switch + generate
│
├── applyTranslations()→ write t(key) to every TEXT_NODES / ATTR_NODES element
├── syncLangButtons()  → highlight the active .lang-btn
│
└── Event listeners + bootstrap (applyTranslations → syncLangButtons → generate)

i18n/translations.js
├── SUPPORTED_LOCALES  ['en', 'it']
├── TRANSLATIONS       { key: { en: '…', it: '…' } }
├── resolveInitialLocale() → localStorage → navigator.language → fallback
├── t(key)             → translated string for the active locale
├── setLocale(locale)  → update activeLocale + write localStorage
└── getLocale()        → return activeLocale
```

---

## Licence

MIT — free for personal and commercial use.
