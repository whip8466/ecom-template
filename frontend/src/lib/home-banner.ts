/** Normalize CTA for Shop Now: supports `/path`, `path`, and `https://…`. */
export function resolveHomeBannerCtaHref(raw: string | undefined | null): string {
  const s = (raw ?? '').trim();
  if (!s) return '/shop';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return s;
  if (s.startsWith('#')) return s;
  return `/${s.replace(/^\/+/, '')}`;
}

/** Public + admin payload for home hero carousel slides */
export type HomeBannerSlide = {
  id?: number;
  sortOrder: number;
  priceLine: string;
  title: string;
  offerPrefix: string;
  offerHighlight: string;
  offerSuffix: string;
  imageUrl: string;
  imageAlt: string;
  ctaHref: string;
  isActive?: boolean;
};
