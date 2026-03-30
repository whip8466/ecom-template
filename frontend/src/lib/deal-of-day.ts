import type { Product } from '@/lib/types';
import type { DealOfDayDealJson } from '@shared/deal-of-day';

/** Row from GET /api/deal-of-day (active deals from the database). */
export type DealOfDayRow = {
  product: Product;
  deal: DealOfDayDealJson;
};

/** Storefront GET /api/deal-of-day — used from the server `page.tsx` so the section can render from the DB on first paint. */
export async function fetchDealOfDayForStore(): Promise<DealOfDayRow[]> {
  const base = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:4000'
  ).replace(/\/$/, '');
  const url = `${base}/api/deal-of-day`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: unknown };
    if (!Array.isArray(json.data)) return [];
    return json.data as DealOfDayRow[];
  } catch {
    return [];
  }
}
