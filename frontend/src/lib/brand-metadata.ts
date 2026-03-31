import type { Metadata } from 'next';
import { coerceBool } from '@/lib/brand-visibility';
import { apiAssetUrl } from '@/lib/api-asset-url';

const FALLBACK_BRAND = 'Dhidi';
const FALLBACK_TAGLINE =
  'Curated fashion, beauty, and home decor for modern living. Quality you can trust, style that lasts.';

type ContactPayload = {
  brandName?: string;
  footerTagline?: string;
  brandLogoUrl?: string | null;
  showBrandLogo?: boolean;
  showBrandName?: boolean;
};

/** Server-side fetch for default document title and description (revalidated periodically). */
export async function getStorefrontBrandForMetadata(): Promise<{
  brandName: string;
  footerTagline: string;
  brandLogoUrl: string | null;
  showBrandLogo: boolean;
}> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/api/contact-settings`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return {
        brandName: FALLBACK_BRAND,
        footerTagline: FALLBACK_TAGLINE,
        brandLogoUrl: null,
        showBrandLogo: true,
      };
    }
    const json = (await res.json()) as { data?: ContactPayload };
    const data = json.data;
    const brandName = (data?.brandName ?? '').trim() || FALLBACK_BRAND;
    const footerTagline = (data?.footerTagline ?? '').trim() || FALLBACK_TAGLINE;
    const rawLogo = data?.brandLogoUrl?.trim();
    const brandLogoUrl = rawLogo ? rawLogo : null;
    const showBrandLogo = coerceBool(data?.showBrandLogo, true);
    return { brandName, footerTagline, brandLogoUrl, showBrandLogo };
  } catch {
    return {
      brandName: FALLBACK_BRAND,
      footerTagline: FALLBACK_TAGLINE,
      brandLogoUrl: null,
      showBrandLogo: true,
    };
  }
}

export async function buildRootMetadata(): Promise<Metadata> {
  const { brandName, footerTagline, brandLogoUrl, showBrandLogo } = await getStorefrontBrandForMetadata();
  const description =
    footerTagline.length > 160 ? `${footerTagline.slice(0, 157)}…` : footerTagline;
  const ogImage = showBrandLogo && brandLogoUrl ? apiAssetUrl(brandLogoUrl) : undefined;
  return {
    title: {
      default: `${brandName} | Premium Lifestyle & Home`,
      template: `%s | ${brandName}`,
    },
    description,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  };
}
