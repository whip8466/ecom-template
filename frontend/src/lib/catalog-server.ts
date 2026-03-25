import { cache } from 'react';
import type { Product } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function fetchProductBySlugUncached(slug: string): Promise<Product | null> {
  const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || 'Failed to load product');
  }
  const json = (await res.json()) as { data: Product };
  return json.data;
}

/** Deduplicated per request when used from metadata + page. */
export const getProductBySlug = cache(fetchProductBySlugUncached);

export async function getRelatedProductsForProduct(current: Product): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/api/products?limit=40`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: Product[] };
  return json.data
    .filter((item) => item.slug !== current.slug)
    .filter((item) =>
      current.category?.id ? item.category?.id === current.category.id : true,
    )
    .slice(0, 4);
}
