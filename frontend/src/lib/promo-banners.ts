export type PromoBannerStyleVariant = 'neutral' | 'accent';

export type PromoBanner = {
  id: number;
  sortOrder: number;
  eyebrowLabel: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  styleVariant: PromoBannerStyleVariant;
  isActive: boolean;
};
