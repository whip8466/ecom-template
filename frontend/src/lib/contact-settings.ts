export type ContactSettings = {
  headline: string;
  brandName: string;
  /** Path on the API host, e.g. `/uploads/brand/{id}.png` */
  brandLogoUrl: string | null;
  /** Storefront: show uploaded logo when true and a logo URL exists. */
  showBrandLogo: boolean;
  /** Storefront: show brand name text. */
  showBrandName: boolean;
  footerTagline: string;
  primaryEmail: string;
  supportEmail: string;
  phone: string;
  addressLine: string;
  mapEmbedUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  pinterestUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  /** Storefront button/input styling; merged with defaults in `mergeStorefrontTheme`. */
  themeJson?: Record<string, unknown> | null;
  updatedAt: string;
};

export type ContactMessageRow = {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  saveInfo: boolean;
  createdAt: string;
};
