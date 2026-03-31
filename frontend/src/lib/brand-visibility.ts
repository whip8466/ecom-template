/**
 * Normalize API booleans — JSON should send real booleans, but we coerce
 * strings/numbers so visibility matches what was saved.
 */
export function coerceBool(v: unknown, defaultWhenMissing: boolean): boolean {
  if (v === true || v === 'true' || v === 1) return true;
  if (v === false || v === 'false' || v === 0) return false;
  return defaultWhenMissing;
}

/** Storefront / footer: whether to show logo (requires URL) and name text. */
export function brandVisibilityFromSettings(
  settings: { showBrandLogo?: unknown; showBrandName?: unknown } | null,
): { showBrandLogo: boolean; showBrandName: boolean } {
  if (settings == null) {
    return { showBrandLogo: true, showBrandName: true };
  }
  return {
    showBrandLogo: coerceBool(settings.showBrandLogo, true),
    showBrandName: coerceBool(settings.showBrandName, true),
  };
}
