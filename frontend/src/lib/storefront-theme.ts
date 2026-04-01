/**
 * Storefront theme tokens persisted in `contact_settings.theme_json`.
 * Applied on the public site via CSS variables (`--sf-*`, layout `--background` / `--card-bg` / …, and synced `--accent`).
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
  /** Border radius for text inputs, textarea, and `select`. */
  inputRadius: string;
  inputBorder: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocusRing: string;
  textareaMinHeight: string;
  /** `<select>` / dropdown-specific (falls back visually to input tokens if unset in DB). */
  selectBackground: string;
  selectBorder: string;
  selectText: string;
  /** `<option>` rows in the open list (supported in many browsers; OS may override). */
  selectOptionBackground: string;
  selectOptionText: string;
  labelText: string;
  checkboxAccent: string;
  /** Page canvas behind content */
  layoutPageBackground: string;
  /** Cards and section bands that use `var(--card-bg)` */
  layoutCardBackground: string;
  /** Softer alternate sections (`var(--cream)`) */
  layoutSectionMutedBackground: string;
  layoutBorder: string;
  /** Default radius for cards / medium surfaces */
  layoutRadius: string;
  /** Larger radius (hero cards, promos) */
  layoutRadiusLarge: string;
  layoutShadowSm: string;
  layoutShadow: string;
  layoutShadowLg: string;
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
  selectBorder: '#d7e4f6',
  selectText: '#111827',
  selectOptionBackground: '#ffffff',
  selectOptionText: '#111827',
  labelText: '#111827',
  checkboxAccent: '#0989ff',
  layoutPageBackground: '#f4f7ff',
  layoutCardBackground: '#ffffff',
  layoutSectionMutedBackground: '#f8faff',
  layoutBorder: '#dce5f2',
  layoutRadius: '0.75rem',
  layoutRadiusLarge: '1rem',
  layoutShadowSm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
  layoutShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
  layoutShadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
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
    selectBorder: pickStr(o.selectBorder) ?? d.selectBorder,
    selectText: pickStr(o.selectText) ?? d.selectText,
    selectOptionBackground: pickStr(o.selectOptionBackground) ?? d.selectOptionBackground,
    selectOptionText: pickStr(o.selectOptionText) ?? d.selectOptionText,
    labelText: pickStr(o.labelText) ?? d.labelText,
    checkboxAccent: pickStr(o.checkboxAccent) ?? d.checkboxAccent,
    layoutPageBackground: pickStr(o.layoutPageBackground) ?? d.layoutPageBackground,
    layoutCardBackground: pickStr(o.layoutCardBackground) ?? d.layoutCardBackground,
    layoutSectionMutedBackground: pickStr(o.layoutSectionMutedBackground) ?? d.layoutSectionMutedBackground,
    layoutBorder: pickStr(o.layoutBorder) ?? d.layoutBorder,
    layoutRadius: pickStr(o.layoutRadius) ?? d.layoutRadius,
    layoutRadiusLarge: pickStr(o.layoutRadiusLarge) ?? d.layoutRadiusLarge,
    layoutShadowSm: pickStr(o.layoutShadowSm) ?? d.layoutShadowSm,
    layoutShadow: pickStr(o.layoutShadow) ?? d.layoutShadow,
    layoutShadowLg: pickStr(o.layoutShadowLg) ?? d.layoutShadowLg,
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
  { key: 'selectBorder', cssVar: '--sf-select-border' },
  { key: 'selectText', cssVar: '--sf-select-text' },
  { key: 'selectOptionBackground', cssVar: '--sf-select-option-bg' },
  { key: 'selectOptionText', cssVar: '--sf-select-option-text' },
  { key: 'labelText', cssVar: '--sf-label-text' },
  { key: 'checkboxAccent', cssVar: '--sf-checkbox-accent' },
  { key: 'layoutPageBackground', cssVar: '--background' },
  { key: 'layoutCardBackground', cssVar: '--card-bg' },
  { key: 'layoutSectionMutedBackground', cssVar: '--cream' },
  { key: 'layoutBorder', cssVar: '--border' },
  { key: 'layoutRadius', cssVar: '--radius' },
  { key: 'layoutRadiusLarge', cssVar: '--radius-lg' },
  { key: 'layoutShadowSm', cssVar: '--shadow-sm' },
  { key: 'layoutShadow', cssVar: '--shadow' },
  { key: 'layoutShadowLg', cssVar: '--shadow-lg' },
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
