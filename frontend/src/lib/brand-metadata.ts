import type { Metadata } from 'next';
import { coerceBool } from '@/lib/brand-visibility';
import { apiAssetUrl } from '@/lib/api-asset-url';
import { getContactSettingsPublic } from '@/lib/contact-settings-public';

const FALLBACK_BRAND = 'Dhidi';
const FALLBACK_TAGLINE =
  'Curated fashion, beauty, and home decor for modern living. Quality you can trust, style that lasts.';

/** Server-side data for default document title and description (revalidated periodically). */
export async function getStorefrontBrandForMetadata(): Promise<{
  brandName: string;
  footerTagline: string;
  brandLogoUrl: string | null;
  showBrandLogo: boolean;
}> {
  const data = await getContactSettingsPublic();
  if (!data) {
    return {
      brandName: FALLBACK_BRAND,
      footerTagline: FALLBACK_TAGLINE,
      brandLogoUrl: null,
      showBrandLogo: true,
    };
  }
  const brandName = (data.brandName ?? '').trim() || FALLBACK_BRAND;
  const footerTagline = (data.footerTagline ?? '').trim() || FALLBACK_TAGLINE;
  const rawLogo = data.brandLogoUrl?.trim();
  const brandLogoUrl = rawLogo ? rawLogo : null;
  const showBrandLogo = coerceBool(data.showBrandLogo, true);
  return { brandName, footerTagline, brandLogoUrl, showBrandLogo };
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
