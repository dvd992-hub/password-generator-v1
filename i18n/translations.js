/**
 * i18n/translations.js
 *
 * Centralised translation strings for EN and IT.
 * Add a new locale by adding a new key to TRANSLATIONS.
 *
 * Usage:
 *   import { t } from './i18n/translations.js';
 *   t('generateBtn')  →  "Generate" | "Genera"
 */

'use strict';

/** All supported locale codes */
const SUPPORTED_LOCALES = ['en', 'it'];

/** Default fallback locale */
const FALLBACK_LOCALE = 'en';

/**
 * Translation map.
 * Keys are camelCase identifiers; values are per-locale strings.
 */
const TRANSLATIONS = {

  /* ── Page ─────────────────────────────────────────── */
  pageTitle:          { en: 'Password Generator', it: 'Generatore di Password' },
  appHeading:         { en: 'Password Generator', it: 'Generatore di Password' },

  /* ── Tabs ──────────────────────────────────────────── */
  tabPassword:        { en: 'Password',   it: 'Password'   },
  tabPassphrase:      { en: 'Passphrase', it: 'Passphrase' },

  /* ── Output area ───────────────────────────────────── */
  outputPlaceholder:  { en: '—', it: '—' },
  ariaPasswordOutput: { en: 'Generated password', it: 'Password generata' },
  tooltipToggleMask:  { en: 'Show / hide',  it: 'Mostra / nascondi' },
  tooltipCopy:        { en: 'Copy',          it: 'Copia'              },
  tooltipRegenerate:  { en: 'Regenerate',    it: 'Rigenera'           },

  /* ── Strength labels ───────────────────────────────── */
  strengthVeryWeak:   { en: 'Very weak',  it: 'Molto debole' },
  strengthWeak:       { en: 'Weak',       it: 'Debole'       },
  strengthFair:       { en: 'Fair',       it: 'Discreta'     },
  strengthStrong:     { en: 'Strong',     it: 'Forte'        },

  /* ── Password options ──────────────────────────────── */
  optLength:          { en: 'Length',                   it: 'Lunghezza'              },
  optUppercase:       { en: 'Uppercase',                it: 'Maiuscole'              },
  optUppercaseSub:    { en: 'A – Z',                    it: 'A – Z'                  },
  optLowercase:       { en: 'Lowercase',                it: 'Minuscole'              },
  optLowercaseSub:    { en: 'a – z',                    it: 'a – z'                  },
  optNumbers:         { en: 'Numbers',                  it: 'Numeri'                 },
  optNumbersSub:      { en: '0 – 9',                    it: '0 – 9'                  },
  optSymbols:         { en: 'Symbols',                  it: 'Simboli'                },
  optSymbolsSub:      { en: '! @ # $ % ^ & *',          it: '! @ # $ % ^ & *'        },
  optExcludeAmbig:    { en: 'Exclude ambiguous chars',  it: 'Escludi caratteri ambigui' },
  optExcludeAmbigSub: { en: '0 O l I 1 — easy to confuse', it: '0 O l I 1 — difficili da distinguere' },

  /* ── Passphrase options ────────────────────────────── */
  optWordCount:       { en: 'Word count',               it: 'Numero parole'          },
  optSeparator:       { en: 'Separator',                it: 'Separatore'             },
  optSeparatorSub:    { en: 'between words',            it: 'tra le parole'          },
  optCapitalize:      { en: 'Capitalize first letter',  it: 'Prima lettera maiuscola'},
  optAppendNumber:    { en: 'Append a number',          it: 'Aggiungi numero finale' },

  /* ── Separator options ─────────────────────────────── */
  sepHyphen:          { en: 'hyphen -',     it: 'trattino -'    },
  sepDot:             { en: 'dot .',        it: 'punto .'       },
  sepUnderscore:      { en: 'underscore _', it: 'underscore _'  },
  sepSpace:           { en: 'space',        it: 'spazio'        },
  sepHash:            { en: 'hash #',       it: 'cancelletto #' },

  /* ── Generate button ───────────────────────────────── */
  generateBtn:        { en: 'Generate',     it: 'Genera'        },

  /* ── Copy feedback ─────────────────────────────────── */
  copiedFeedback:     { en: 'Copied to clipboard!', it: 'Copiata negli appunti!' },

  /* ── Error messages ────────────────────────────────── */
  errorNoCharset:     { en: 'Select at least one character type', it: 'Seleziona almeno un tipo di carattere' },

  /* ── History ───────────────────────────────────────── */
  historyTitle:       { en: 'History',       it: 'Cronologia'     },
  historyClearAll:    { en: 'Clear all',     it: 'Cancella tutto' },
  historyEmpty:       { en: 'No passwords generated yet', it: 'Nessuna password generata' },
  histBadgePass:      { en: 'pass',   it: 'pass'  },
  histBadgePhrase:    { en: 'phrase', it: 'frase' },
  histCopyAria:       { en: 'Copy this entry', it: 'Copia questa voce' },

  /* ── Language toggle ───────────────────────────────── */
  langToggleAria:     { en: 'Switch language', it: 'Cambia lingua' },

  /* ── ARIA labels ───────────────────────────────────── */
  ariaTabList:        { en: 'Generation mode',   it: 'Modalità di generazione' },
  ariaHistoryList:    { en: 'Password history',  it: 'Cronologia password'     },
  ariaIncludeUpper:   { en: 'Include uppercase letters', it: 'Includi lettere maiuscole' },
  ariaIncludeLower:   { en: 'Include lowercase letters', it: 'Includi lettere minuscole' },
  ariaIncludeNums:    { en: 'Include numbers',    it: 'Includi numeri'          },
  ariaIncludeSyms:    { en: 'Include symbols',    it: 'Includi simboli'         },
  ariaExcludeAmbig:   { en: 'Exclude ambiguous characters', it: 'Escludi caratteri ambigui' },
  ariaCapitalize:     { en: 'Capitalize first letter of each word', it: 'Capitalizza la prima lettera di ogni parola' },
  ariaAppendNumber:   { en: 'Append a random number at the end',    it: 'Aggiungi un numero casuale in fondo'        },
  ariaSeparator:      { en: 'Separator between words', it: 'Separatore tra le parole' },
  ariaClearHistory:   { en: 'Clear history',     it: 'Cancella cronologia'     },
};

/* ──────────────────────────────────────────────────────
   Runtime state — resolved once at startup
   ────────────────────────────────────────────────────── */

/** Currently active locale ('en' | 'it') */
let activeLocale = FALLBACK_LOCALE;

/**
 * Resolve the locale to use on startup.
 * Priority: localStorage override → navigator.language → fallback
 *
 * @returns {string} Resolved locale code
 */
function resolveInitialLocale() {
  // 1. User's saved preference
  const saved = localStorage.getItem('pg_locale');
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;

  // 2. Browser / OS language (take first two chars: "it-IT" → "it")
  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_LOCALES.includes(browserLang)) return browserLang;

  // 3. Fallback
  return FALLBACK_LOCALE;
}

/**
 * Translate a key into the active locale.
 * Falls back to EN if the key is missing in the active locale.
 *
 * @param {string} key - Key from TRANSLATIONS
 * @returns {string} Translated string
 */
function t(key) {
  const entry = TRANSLATIONS[key];
  if (!entry) {
    console.warn(`[i18n] Missing translation key: "${key}"`);
    return key;
  }
  return entry[activeLocale] ?? entry[FALLBACK_LOCALE] ?? key;
}

/**
 * Change the active locale, persist it to localStorage,
 * and return the new locale string.
 *
 * @param {string} locale - Target locale ('en' | 'it')
 * @returns {string} The locale that was set
 */
function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`[i18n] Unsupported locale: "${locale}". Falling back to "${FALLBACK_LOCALE}".`);
    locale = FALLBACK_LOCALE;
  }
  activeLocale = locale;
  localStorage.setItem('pg_locale', locale);
  return activeLocale;
}

/**
 * Return the currently active locale.
 * @returns {string}
 */
function getLocale() {
  return activeLocale;
}

/** Initialise locale on module load */
activeLocale = resolveInitialLocale();
