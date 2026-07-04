/**
 * js/script.js
 *
 * Password Generator — main application logic.
 *
 * File structure:
 *   1.  Character-set constants
 *   2.  Italian wordlist (passphrase mode)
 *   3.  Global state
 *   4.  DOM references
 *   5.  Strength-meter helpers
 *   6.  Password generation
 *   7.  Passphrase generation
 *   8.  Output rendering
 *   9.  Clipboard copy
 *  10.  History
 *  11.  UI helpers (mask toggle, tab switch)
 *  12.  i18n — apply translations to the DOM
 *  13.  Event listeners
 *  14.  Bootstrap
 */

'use strict';

/* ================================================
   1. CHARACTER-SET CONSTANTS
   Using named constants makes it easy to extend or
   replace individual pools without touching logic.
   ================================================ */

/** Uppercase Latin letters */
const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Lowercase Latin letters */
const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';

/** Decimal digits */
const CHARS_NUMS = '0123456789';

/** Common printable symbols (no spaces) */
const CHARS_SYMS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

/**
 * Characters that look similar across common fonts.
 * Removed when "Exclude ambiguous chars" is enabled.
 */
const AMBIGUOUS_RE = /[0OlI1]/g;


/* ================================================
   2. ITALIAN WORDLIST — passphrase mode
   50 common Italian nouns, easy to pronounce and
   remember. Extend freely.
   ================================================ */

const WORDLIST = [
  'corvo','nuvola','pietra','fiume','vento','luna','stelle','bosco',
  'mare','sole','lago','monte','nebbia','roccia','fuoco','ghiaccio',
  'alba','tramonto','onda','prato','tigre','lupo','aquila','orso',
  'volpe','cervo','falco','gatto','leone','delfino','sasso','foglia',
  'ramo','radice','tronco','fiore','frutto','seme','terra','cielo',
  'aurora','tempesta','brezza','cascata','campo','collina','valle',
  'canyon','foresta','deserto',
];


/* ================================================
   3. GLOBAL STATE
   ================================================ */

/** Active generation mode: 'password' | 'passphrase' */
let currentMode = 'password';

/**
 * Ring-buffer of the last N generated entries.
 * Each entry: { text: string, time: string, mode: string }
 */
let historyEntries = [];

/** Maximum number of history entries to keep */
const HISTORY_LIMIT = 10;

/** Whether the output field is masked with bullet characters */
let isMasked = true;

/** Full plaintext of the currently displayed password */
let currentPassword = '';


/* ================================================
   4. DOM REFERENCES
   Cached once at startup — cheaper than repeated
   querySelector calls on every keystroke/event.
   ================================================ */

const elPass      = document.getElementById('pg-pass');
const elLen       = document.getElementById('pg-len');
const elLenVal    = document.getElementById('pg-len-val');
const elWords     = document.getElementById('pg-words');
const elWordsVal  = document.getElementById('pg-words-val');
const elFeedback  = document.getElementById('pg-feedback');
const elHistList  = document.getElementById('pg-hist-list');
const elEmpty     = document.getElementById('pg-empty');
const elSlabel    = document.getElementById('pg-slabel');
const elEyeIcon   = document.getElementById('pg-eye-icon');

/** The four strength-meter bars */
const bars = [0, 1, 2, 3].map(i => document.getElementById('b' + i));

/**
 * Strength-level colours — kept in sync with CSS custom properties.
 * Index 0 = very weak … 3 = strong.
 */
const STRENGTH_COLOURS = ['#E24B4A', '#BA7517', '#3B6D11', '#0F6E56'];


/* ================================================
   5. STRENGTH-METER HELPERS
   ================================================ */

/**
 * Estimate password entropy in bits.
 * Formula: H = L × log₂(N)
 *   L = password length
 *   N = pool size inferred from character classes present
 *
 * Infer instead of reading the checkboxes so this works
 * for passphrase mode too.
 *
 * @param {string} password
 * @returns {number} Entropy in bits
 */
function estimateEntropy(password) {
  let poolSize = 0;
  if (/[A-Z]/.test(password))      poolSize += 26;  // uppercase
  if (/[a-z]/.test(password))      poolSize += 26;  // lowercase
  if (/[0-9]/.test(password))      poolSize += 10;  // digits
  if (/[^A-Za-z0-9]/.test(password)) poolSize += 32; // symbols / separators

  if (poolSize === 0 || password.length === 0) return 0;

  // log₂(N^L) = L × log₂(N)
  return password.length * Math.log2(poolSize);
}

/**
 * Colour the strength bars and update the label.
 *
 * @param {number} level  -1 = reset, 0–3 = strength level
 */
function setStrengthUI(level) {
  bars.forEach((bar, i) => {
    bar.style.background = (i <= level && level >= 0)
      ? STRENGTH_COLOURS[level]
      : 'var(--border)';
  });

  if (level < 0) {
    elSlabel.textContent = '';
    return;
  }

  // Map level → translation key
  const keys = ['strengthVeryWeak', 'strengthWeak', 'strengthFair', 'strengthStrong'];
  elSlabel.textContent = t(keys[level]);
}

/**
 * Compute the strength level from entropy and update the UI.
 *
 * Thresholds (NIST-inspired):
 *   < 40 bit  → very weak (0)
 *   40–59 bit → weak     (1)
 *   60–79 bit → fair     (2)
 *   ≥ 80 bit  → strong   (3)
 *
 * @param {string} password
 */
function updateStrength(password) {
  if (!password) { setStrengthUI(-1); return; }

  const entropy = estimateEntropy(password);
  const level =
    entropy < 40 ? 0 :
    entropy < 60 ? 1 :
    entropy < 80 ? 2 : 3;

  setStrengthUI(level);
}


/* ================================================
   6. PASSWORD GENERATION
   ================================================ */

/**
 * Pick a random element from an array using a
 * cryptographically secure random number (CSPRNG).
 * Avoids Math.random() which is NOT cryptographically secure.
 *
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function cryptoRandom(arr) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return arr[buf[0] % arr.length];
}

/**
 * Generate a random password based on the current UI options.
 *
 * Steps:
 *  1. Build a character pool from enabled charsets.
 *  2. Optionally strip ambiguous characters.
 *  3. Pick `length` characters using the CSPRNG.
 *
 * @returns {string} Generated password, or '' if pool is empty.
 */
function generatePassword() {
  const length = parseInt(elLen.value, 10);

  // Build pool from checked options
  let pool = '';
  if (document.getElementById('opt-upper').checked) pool += CHARS_UPPER;
  if (document.getElementById('opt-lower').checked) pool += CHARS_LOWER;
  if (document.getElementById('opt-num').checked)   pool += CHARS_NUMS;
  if (document.getElementById('opt-sym').checked)   pool += CHARS_SYMS;

  // Remove visually ambiguous characters if requested
  if (document.getElementById('opt-ambig').checked) {
    pool = pool.replace(AMBIGUOUS_RE, '');
  }

  if (!pool) return '';

  // Draw `length` cryptographically random characters
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(n => pool[n % pool.length]).join('');
}


/* ================================================
   7. PASSPHRASE GENERATION
   ================================================ */

/**
 * Generate a passphrase from the Italian wordlist.
 *
 * Example output: "Lupo-Cascata-Fiore-73"
 *
 * @returns {string} Generated passphrase
 */
function generatePassphrase() {
  const count      = parseInt(elWords.value, 10);
  const separator  = document.getElementById('pg-sep').value;
  const capitalize = document.getElementById('opt-capitalize').checked;
  const addNumber  = document.getElementById('opt-num-phrase').checked;

  const words = Array.from({ length: count }, () => {
    let word = cryptoRandom(WORDLIST);
    // Capitalise the first letter of each word if requested
    if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
    return word;
  });

  let phrase = words.join(separator);

  if (addNumber) {
    // Append a two-digit number (10–99) for extra entropy
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    phrase += separator + ((buf[0] % 90) + 10);
  }

  return phrase;
}


/* ================================================
   8. OUTPUT RENDERING
   ================================================ */

/**
 * Render the password / passphrase in the output field.
 * Applies masking in password mode, updates the strength meter.
 *
 * @param {string} password - Plaintext to display
 */
function renderOutput(password) {
  if (currentMode === 'passphrase') {
    // Passphrases are always shown in plain text with readable font
    elPass.className = 'pg-pass pg-phrase';
    elPass.textContent = password;
  } else {
    // Passwords use monospace; optionally masked with bullets
    elPass.className = 'pg-pass';
    elPass.textContent = isMasked
      ? password.replace(/./g, '•')
      : password;
  }

  updateStrength(password);
}

/**
 * Main generate entry-point.
 * Delegates to the correct generator, then renders output and
 * adds to history.
 */
function generate() {
  const result = currentMode === 'password'
    ? generatePassword()
    : generatePassphrase();

  // Empty result means the charset pool was empty
  if (!result) {
    elPass.className = 'pg-pass';
    elPass.textContent = t('errorNoCharset');
    setStrengthUI(-1);
    return;
  }

  currentPassword = result;
  renderOutput(result);
  addToHistory(result);
}


/* ================================================
   9. CLIPBOARD COPY
   ================================================ */

/**
 * Write text to the system clipboard and show the toast.
 * Uses the modern async Clipboard API (requires secure context).
 *
 * @param {string} text
 */
function copyToClipboard(text) {
  if (!text) return;

  navigator.clipboard.writeText(text)
    .then(() => {
      // Show feedback toast for 2 seconds then fade out
      elFeedback.style.opacity = '1';
      setTimeout(() => { elFeedback.style.opacity = '0'; }, 2000);
    })
    .catch(err => console.error('[copy] Clipboard write failed:', err));
}


/* ================================================
   10. HISTORY
   ================================================ */

/**
 * Prepend a new entry to the history ring-buffer and re-render the list.
 * Entries beyond HISTORY_LIMIT are silently dropped from the tail.
 *
 * @param {string} password
 */
function addToHistory(password) {
  const now = new Date();
  const time =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  historyEntries.unshift({ text: password, time, mode: currentMode });

  if (historyEntries.length > HISTORY_LIMIT) {
    historyEntries.pop();
  }

  renderHistory();
}

/**
 * Re-render the history list from the current state array.
 * Shows the empty-state placeholder when the list is empty.
 */
function renderHistory() {
  if (!historyEntries.length) {
    elHistList.innerHTML = '';
    elEmpty.textContent = t('historyEmpty');
    elHistList.appendChild(elEmpty);
    elEmpty.style.display = '';
    return;
  }

  elEmpty.style.display = 'none';
  elHistList.innerHTML = '';

  historyEntries.forEach(entry => {
    // ── Row container ──────────────────────────────
    const item = document.createElement('div');
    item.className = 'pg-hist-item';

    // ── Password / passphrase text (truncated by CSS) ──
    const span = document.createElement('span');
    span.className = entry.mode === 'passphrase'
      ? 'pg-hist-pass pg-hist-phrase'
      : 'pg-hist-pass';
    span.textContent = entry.text;
    span.title = entry.text; // full text on hover

    // ── Type badge ("pass" | "phrase") ─────────────
    const badge = document.createElement('span');
    badge.className = 'pg-hist-badge';
    badge.textContent = entry.mode === 'passphrase'
      ? t('histBadgePhrase')
      : t('histBadgePass');

    // ── Timestamp ──────────────────────────────────
    const meta = document.createElement('span');
    meta.className = 'pg-hist-meta';
    meta.textContent = entry.time;

    // ── Copy button ────────────────────────────────
    const copyBtn = document.createElement('button');
    copyBtn.className = 'pg-hist-copy';
    copyBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-copy"/></svg>';
    copyBtn.setAttribute('aria-label', t('histCopyAria'));
    copyBtn.addEventListener('click', () => copyToClipboard(entry.text));

    item.appendChild(span);
    item.appendChild(badge);
    item.appendChild(meta);
    item.appendChild(copyBtn);
    elHistList.appendChild(item);
  });
}


/* ================================================
   11. UI HELPERS
   ================================================ */

/**
 * Toggle between masked (•••) and plaintext password display.
 * Only applies in password mode — passphrases are always visible.
 */
function toggleMask() {
  if (currentMode === 'passphrase') return;

  isMasked = !isMasked;

  // Swap the eye icon between open and closed variants
  elEyeIcon.querySelector('use').setAttribute(
    'href',
    isMasked ? '#icon-eye' : '#icon-eye-off'
  );

  renderOutput(currentPassword);
}

/**
 * Activate the Password tab.
 * Resets masking state and shows the password options panel.
 */
function activatePasswordMode() {
  currentMode = 'password';
  isMasked = true;

  document.getElementById('tab-pass').classList.add('active');
  document.getElementById('tab-pass').setAttribute('aria-selected', 'true');
  document.getElementById('tab-phrase').classList.remove('active');
  document.getElementById('tab-phrase').setAttribute('aria-selected', 'false');

  document.getElementById('pane-pass').style.display = '';
  document.getElementById('pane-phrase').style.display = 'none';

  // Reset eye icon to "visible" state
  elEyeIcon.querySelector('use').setAttribute('href', '#icon-eye');
  document.getElementById('pg-eye').style.display = '';

  generate();
}

/**
 * Activate the Passphrase tab.
 * Hides the mask button (not applicable to passphrases).
 */
function activatePassphraseMode() {
  currentMode = 'passphrase';

  document.getElementById('tab-phrase').classList.add('active');
  document.getElementById('tab-phrase').setAttribute('aria-selected', 'true');
  document.getElementById('tab-pass').classList.remove('active');
  document.getElementById('tab-pass').setAttribute('aria-selected', 'false');

  document.getElementById('pane-phrase').style.display = '';
  document.getElementById('pane-pass').style.display = 'none';

  // The mask button is meaningless for passphrases
  document.getElementById('pg-eye').style.display = 'none';

  generate();
}


/* ================================================
   12. i18n — APPLY TRANSLATIONS TO THE DOM
   ================================================ */

/**
 * Map of DOM element id → translation key.
 * Elements whose textContent should be updated on locale change.
 */
const TEXT_NODES = {
  'pg-heading-text':  'appHeading',
  'tab-pass':         'tabPassword',
  'tab-phrase':       'tabPassphrase',
  'pg-empty':         'historyEmpty',
  'pg-hist-clear':    'historyClearAll',
  'pg-gen-text':      'generateBtn',
  'pg-feedback-text': 'copiedFeedback',
  'pg-hist-label':    'historyTitle',
  // option labels
  'lbl-length':       'optLength',
  'lbl-upper':        'optUppercase',
  'lbl-upper-sub':    'optUppercaseSub',
  'lbl-lower':        'optLowercase',
  'lbl-lower-sub':    'optLowercaseSub',
  'lbl-nums':         'optNumbers',
  'lbl-nums-sub':     'optNumbersSub',
  'lbl-syms':         'optSymbols',
  'lbl-syms-sub':     'optSymbolsSub',
  'lbl-ambig':        'optExcludeAmbig',
  'lbl-ambig-sub':    'optExcludeAmbigSub',
  'lbl-word-count':   'optWordCount',
  'lbl-separator':    'optSeparator',
  'lbl-sep-sub':      'optSeparatorSub',
  'lbl-capitalize':   'optCapitalize',
  'lbl-append-num':   'optAppendNumber',
};

/**
 * Map of DOM element id → attribute name → translation key.
 * ARIA / title attributes that need translating.
 */
const ATTR_NODES = {
  'pg-eye':         { title: 'tooltipToggleMask', 'aria-label': 'tooltipToggleMask' },
  'pg-copy':        { title: 'tooltipCopy',        'aria-label': 'tooltipCopy'       },
  'pg-refresh':     { title: 'tooltipRegenerate',  'aria-label': 'tooltipRegenerate' },
  'pg-hist-clear':  { 'aria-label': 'ariaClearHistory' },
  'pg-pass':        { 'aria-label': 'ariaPasswordOutput' },
  'pg-tabs':        { 'aria-label': 'ariaTabList'  },
  'pg-hist-list':   { 'aria-label': 'ariaHistoryList' },
  'toggle-upper':   { 'aria-label': 'ariaIncludeUpper' },
  'toggle-lower':   { 'aria-label': 'ariaIncludeLower' },
  'toggle-num':     { 'aria-label': 'ariaIncludeNums'  },
  'toggle-sym':     { 'aria-label': 'ariaIncludeSyms'  },
  'toggle-ambig':   { 'aria-label': 'ariaExcludeAmbig' },
  'toggle-cap':     { 'aria-label': 'ariaCapitalize'   },
  'toggle-apnum':   { 'aria-label': 'ariaAppendNumber' },
  'pg-sep':         { 'aria-label': 'ariaSeparator'    },
  'lang-toggle':    { 'aria-label': 'langToggleAria'   },
};

/** Separator <select> option values → translation keys */
const SEP_OPTIONS = {
  '-': 'sepHyphen',
  '.': 'sepDot',
  '_': 'sepUnderscore',
  ' ': 'sepSpace',
  '#': 'sepHash',
};

/**
 * Re-translate every labelled element in the DOM.
 * Called once on startup and again whenever the locale changes.
 */
function applyTranslations() {
  // Update <title>
  document.title = t('pageTitle');

  // Update textContent nodes
  Object.entries(TEXT_NODES).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  });

  // Update attributes
  Object.entries(ATTR_NODES).forEach(([id, attrs]) => {
    const el = document.getElementById(id);
    if (!el) return;
    Object.entries(attrs).forEach(([attr, key]) => {
      el.setAttribute(attr, t(key));
    });
  });

  // Update separator <select> option labels
  const sepEl = document.getElementById('pg-sep');
  if (sepEl) {
    Array.from(sepEl.options).forEach(opt => {
      const key = SEP_OPTIONS[opt.value];
      if (key) opt.textContent = t(key);
    });
  }

  // Update the strength label for the current password
  updateStrength(currentPassword);

  // Re-render history so badges use the correct locale
  renderHistory();
}

/**
 * Update the language toggle button styles to reflect the
 * currently active locale.
 */
function syncLangButtons() {
  const locale = getLocale();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === locale);
  });
}


/* ================================================
   13. EVENT LISTENERS
   ================================================ */

// ── Tab switches ──────────────────────────────────
document.getElementById('tab-pass').addEventListener('click', activatePasswordMode);
document.getElementById('tab-phrase').addEventListener('click', activatePassphraseMode);

// ── Output action buttons ─────────────────────────
document.getElementById('pg-gen').addEventListener('click', generate);
document.getElementById('pg-refresh').addEventListener('click', generate);
document.getElementById('pg-copy').addEventListener('click', () => copyToClipboard(currentPassword));
document.getElementById('pg-eye').addEventListener('click', toggleMask);

// ── History ───────────────────────────────────────
document.getElementById('pg-hist-clear').addEventListener('click', () => {
  historyEntries = [];
  renderHistory();
});

// ── Sliders ───────────────────────────────────────
elLen.addEventListener('input', () => {
  elLenVal.textContent = elLen.value;
  if (currentPassword) generate();
});

elWords.addEventListener('input', () => {
  elWordsVal.textContent = elWords.value;
  if (currentPassword) generate();
});

// ── Option checkboxes and select ──────────────────
// Re-generate whenever any option changes
[
  'opt-upper', 'opt-lower', 'opt-num', 'opt-sym', 'opt-ambig', // password
  'pg-sep', 'opt-capitalize', 'opt-num-phrase',                 // passphrase
].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => { if (currentPassword) generate(); });
});

// ── Language toggle ───────────────────────────────
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setLocale(btn.dataset.lang); // persist to localStorage
    syncLangButtons();
    applyTranslations();
  });
});


/* ================================================
   14. BOOTSTRAP
   Run once the DOM is fully parsed.
   ================================================ */

// Apply the resolved locale to all DOM text nodes
applyTranslations();
syncLangButtons();

// Generate the first password immediately
generate();
