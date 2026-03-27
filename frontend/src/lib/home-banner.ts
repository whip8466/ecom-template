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
