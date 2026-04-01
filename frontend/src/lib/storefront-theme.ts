/**
 * Storefront form + button tokens persisted in `contact_settings.theme_json`.
 * Applied on the public site via CSS variables (`--sf-*` and synced `--accent`).
 */

export type StorefrontThemeTokens = {
  buttonPrimaryBg: string;
  buttonPrimaryHover: string;
  buttonSecondaryBg: string;
  buttonSecondaryBorder: string;
  buttonSecondaryText: string;
  buttonInfoBg: string;
  buttonInfoHover: string;
  /** Border radius for primary / secondary / info buttons */
  buttonRadius: string;
  /** Border radius for text inputs, textarea, select */
  inputRadius: string;
  inputBorder: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocusRing: string;
  textareaMinHeight: string;
  selectBackground: string;
  labelText: string;
  checkboxAccent: string;
};

export const DEFAULT_STOREFRONT_THEME: StorefrontThemeTokens = {
  buttonPrimaryBg: '#0989ff',
  buttonPrimaryHover: '#0476df',
  buttonSecondaryBg: '#ffffff',
  buttonSecondaryBorder: '#d7e4f6',
  buttonSecondaryText: '#1d2e4b',
  buttonInfoBg: '#0ea5e9',
  buttonInfoHover: '#0284c7',
  buttonRadius: '0.375rem',
  inputRadius: '0.375rem',
  inputBorder: '#d7e4f6',
  inputBackground: '#ffffff',
  inputText: '#111827',
  inputPlaceholder: '#94a3b8',
  inputFocusRing: '#0989ff',
  textareaMinHeight: '8rem',
  selectBackground: '#ffffff',
  labelText: '#111827',
  checkboxAccent: '#0989ff',
};

function pickStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

/** Merge API / DB JSON with defaults (invalid keys ignored). */
export function mergeStorefrontTheme(raw: unknown): StorefrontThemeTokens {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_STOREFRONT_THEME;
  return {
    buttonPrimaryBg: pickStr(o.buttonPrimaryBg) ?? d.buttonPrimaryBg,
    buttonPrimaryHover: pickStr(o.buttonPrimaryHover) ?? d.buttonPrimaryHover,
    buttonSecondaryBg: pickStr(o.buttonSecondaryBg) ?? d.buttonSecondaryBg,
    buttonSecondaryBorder: pickStr(o.buttonSecondaryBorder) ?? d.buttonSecondaryBorder,
    buttonSecondaryText: pickStr(o.buttonSecondaryText) ?? d.buttonSecondaryText,
    buttonInfoBg: pickStr(o.buttonInfoBg) ?? d.buttonInfoBg,
    buttonInfoHover: pickStr(o.buttonInfoHover) ?? d.buttonInfoHover,
    buttonRadius: pickStr(o.buttonRadius) ?? d.buttonRadius,
    inputRadius: pickStr(o.inputRadius) ?? d.inputRadius,
    inputBorder: pickStr(o.inputBorder) ?? d.inputBorder,
    inputBackground: pickStr(o.inputBackground) ?? d.inputBackground,
    inputText: pickStr(o.inputText) ?? d.inputText,
    inputPlaceholder: pickStr(o.inputPlaceholder) ?? d.inputPlaceholder,
    inputFocusRing: pickStr(o.inputFocusRing) ?? d.inputFocusRing,
    textareaMinHeight: pickStr(o.textareaMinHeight) ?? d.textareaMinHeight,
    selectBackground: pickStr(o.selectBackground) ?? d.selectBackground,
    labelText: pickStr(o.labelText) ?? d.labelText,
    checkboxAccent: pickStr(o.checkboxAccent) ?? d.checkboxAccent,
  };
}

/** Serialize tokens to `theme_json` for PATCH (only defined keys from partial UI state — admin sends full object). */
export function themeTokensToJson(t: StorefrontThemeTokens): Record<string, string> {
  return { ...t };
}

export const STOREFRONT_THEME_CSS_VAR_MAP: { key: keyof StorefrontThemeTokens; cssVar: string }[] = [
  { key: 'buttonPrimaryBg', cssVar: '--sf-btn-primary-bg' },
  { key: 'buttonPrimaryHover', cssVar: '--sf-btn-primary-hover' },
  { key: 'buttonSecondaryBg', cssVar: '--sf-btn-secondary-bg' },
  { key: 'buttonSecondaryBorder', cssVar: '--sf-btn-secondary-border' },
  { key: 'buttonSecondaryText', cssVar: '--sf-btn-secondary-text' },
  { key: 'buttonInfoBg', cssVar: '--sf-btn-info-bg' },
  { key: 'buttonInfoHover', cssVar: '--sf-btn-info-hover' },
  { key: 'buttonRadius', cssVar: '--sf-btn-radius' },
  { key: 'inputRadius', cssVar: '--sf-input-radius' },
  { key: 'inputBorder', cssVar: '--sf-input-border' },
  { key: 'inputBackground', cssVar: '--sf-input-bg' },
  { key: 'inputText', cssVar: '--sf-input-text' },
  { key: 'inputPlaceholder', cssVar: '--sf-input-placeholder' },
  { key: 'inputFocusRing', cssVar: '--sf-input-focus' },
  { key: 'textareaMinHeight', cssVar: '--sf-textarea-min-h' },
  { key: 'selectBackground', cssVar: '--sf-select-bg' },
  { key: 'labelText', cssVar: '--sf-label-text' },
  { key: 'checkboxAccent', cssVar: '--sf-checkbox-accent' },
];

/** Apply tokens to `document.documentElement` for storefront (client-only). */
export function applyStorefrontThemeToDocument(tokens: StorefrontThemeTokens): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const { key, cssVar } of STOREFRONT_THEME_CSS_VAR_MAP) {
    root.style.setProperty(cssVar, tokens[key]);
  }
  root.style.setProperty('--accent', tokens.buttonPrimaryBg);
  root.style.setProperty('--accent-hover', tokens.buttonPrimaryHover);
}

/** Inline CSS variables for preview (scoped `div`). */
export function themeTokensToCssProperties(tokens: StorefrontThemeTokens): Record<string, string> {
  const style: Record<string, string> = {};
  for (const { key, cssVar } of STOREFRONT_THEME_CSS_VAR_MAP) {
    style[cssVar] = tokens[key];
  }
  style['--accent'] = tokens.buttonPrimaryBg;
  style['--accent-hover'] = tokens.buttonPrimaryHover;
  return style;
}
