import { cache } from 'react';
import type { SitePageDto } from '@/lib/site-pages';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function fetchSitePageUncached(slug: string): Promise<SitePageDto | null> {
  const res = await fetch(`${API_BASE_URL}/api/site-pages/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as { data: SitePageDto };
  return json.data ?? null;
}

export const getSitePage = cache(fetchSitePageUncached);
