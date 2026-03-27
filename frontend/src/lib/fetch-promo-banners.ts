import type { PromoBanner } from '@/lib/promo-banners';

/** Storefront GET /api/promo-banners — used from the server `page.tsx` so banners come from the DB on first render. */
export async function fetchPromoBannersForStore(): Promise<PromoBanner[]> {
  const base = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:4000'
  ).replace(/\/$/, '');
  const url = `${base}/api/promo-banners`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: unknown };
    if (!Array.isArray(json.data)) return [];
    return json.data as PromoBanner[];
  } catch {
    return [];
  }
}
