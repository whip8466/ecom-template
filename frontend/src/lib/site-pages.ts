export const SITE_PAGE_SLUGS = ['privacy-policy', 'terms-of-service'] as const;

export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

export type SitePageDto = {
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
};

export const SITE_PAGE_LABELS: Record<SitePageSlug, string> = {
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
};

export function isSitePageSlug(s: string): s is SitePageSlug {
  return (SITE_PAGE_SLUGS as readonly string[]).includes(s);
}
