import { cache } from 'react';
import type { CSSProperties } from 'react';
import type { ContactSettings } from '@/lib/contact-settings';
import { mergeStorefrontTheme, themeTokensToCssProperties } from '@/lib/storefront-theme';

/** One fetch per request (shared with metadata + root layout) for public contact/theme settings. */
export const getContactSettingsPublic = cache(async (): Promise<ContactSettings | null> => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/api/contact-settings`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: ContactSettings };
    return json.data ?? null;
  } catch {
    return null;
  }
});

/** Inline `:root`-style vars on `<html>` so theme matches DB before client hydration. */
export async function getStorefrontThemeRootStyle(): Promise<CSSProperties> {
  const data = await getContactSettingsPublic();
  return themeTokensToCssProperties(mergeStorefrontTheme(data?.themeJson)) as CSSProperties;
}
